"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingSkeleton,
  EmptyState,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { SCHEDULE_E_CATEGORIES } from "@/lib/constants";
import { exportToCSV } from "@/lib/csv-export";

// ---------- Types ----------

interface PropertyReport {
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  rentalIncome: number;
  expenses: Record<string, number>;
  totalExpenses: number;
  netIncome: number;
}

interface ScheduleEData {
  year: number;
  properties: PropertyReport[];
  totals: {
    rentalIncome: number;
    totalExpenses: number;
    netIncome: number;
    expenses: Record<string, number>;
  };
}

// ---------- Helpers ----------

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

// ---------- Page ----------

export default function ScheduleEPage() {
  const [year, setYear] = useState(String(currentYear));
  const [propertyId, setPropertyId] = useState("all");
  const [properties, setProperties] = useState<
    { value: string; label: string }[]
  >([]);
  const [data, setData] = useState<ScheduleEData | null>(null);
  const [loading, setLoading] = useState(false);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);

  // Fetch properties list for filter
  const fetchProperties = useCallback(async () => {
    if (propertiesLoaded) return;
    try {
      const res = await fetch("/api/properties");
      if (!res.ok) return;
      const json = await res.json();
      const list = (json.properties ?? json ?? []).map(
        (p: { id: string; name: string }) => ({
          value: p.id,
          label: p.name,
        })
      );
      setProperties(list);
      setPropertiesLoaded(true);
    } catch {
      /* silent */
    }
  }, [propertiesLoaded]);

  // Fetch on mount
  useState(() => {
    fetchProperties();
  });

  async function handleGenerate() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year });
      if (propertyId !== "all") params.set("propertyId", propertyId);
      const res = await fetch(`/api/reports/schedule-e?${params}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (!data) return;

    const rows: Record<string, unknown>[] = [];
    for (const prop of data.properties) {
      // Income row
      rows.push({
        Property: prop.propertyName,
        Address: prop.propertyAddress,
        Category: "Rental Income",
        Amount: prop.rentalIncome,
      });
      // Expense rows
      for (const cat of SCHEDULE_E_CATEGORIES) {
        rows.push({
          Property: prop.propertyName,
          Address: prop.propertyAddress,
          Category: cat.label,
          Amount: prop.expenses[cat.value] ?? 0,
        });
      }
      rows.push({
        Property: prop.propertyName,
        Address: prop.propertyAddress,
        Category: "Total Expenses",
        Amount: prop.totalExpenses,
      });
      rows.push({
        Property: prop.propertyName,
        Address: prop.propertyAddress,
        Category: "Net Income",
        Amount: prop.netIncome,
      });
    }

    exportToCSV(rows, `schedule-e-${data.year}.csv`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          href="/reports"
          className="mb-4"
        >
          Reports
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Schedule E Report
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          IRS Schedule E rental income and expense report by property.
        </p>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-40">
            <Select
              label="Tax Year"
              options={yearOptions}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              label="Property"
              options={[
                { value: "all", label: "All Properties" },
                ...properties,
              ]}
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerate} loading={loading} loadingText="Generating...">
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {loading && <LoadingSkeleton variant="card" count={2} />}

      {/* Report Data */}
      {!loading && data && data.properties.length > 0 && (
        <div className="space-y-6">
          {/* Export buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button variant="outline" size="sm" disabled>
              Export PDF
            </Button>
          </div>

          {/* Per-property sections */}
          {data.properties.map((prop) => (
            <Card key={prop.propertyId}>
              <CardHeader>
                <CardTitle>{prop.propertyName}</CardTitle>
                <p className="text-sm text-gray-500">{prop.propertyAddress}</p>
              </CardHeader>
              <CardContent>
                {/* Rental Income */}
                <div className="mb-4 flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Rental Income
                  </span>
                  <span className="text-sm font-bold text-[#5c7c65]">
                    {formatCurrency(prop.rentalIncome)}
                  </span>
                </div>

                {/* Expense breakdown */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SCHEDULE_E_CATEGORIES.map((cat) => (
                      <TableRow key={cat.value}>
                        <TableCell>{cat.label}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(prop.expenses[cat.value] ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Total Expenses
                    </span>
                    <span className="text-sm font-bold text-[#d4856a]">
                      {formatCurrency(prop.totalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Net Income
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        prop.netIncome >= 0 ? "text-[#5c7c65]" : "text-[#d4856a]"
                      }`}
                    >
                      {formatCurrency(prop.netIncome)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Portfolio Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total Rental Income
                  </span>
                  <span className="text-sm font-bold text-[#5c7c65]">
                    {formatCurrency(data.totals.rentalIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total Expenses
                  </span>
                  <span className="text-sm font-bold text-[#d4856a]">
                    {formatCurrency(data.totals.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-sm font-semibold text-gray-900">
                    Net Income
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      data.totals.netIncome >= 0
                        ? "text-[#5c7c65]"
                        : "text-[#d4856a]"
                    }`}
                  >
                    {formatCurrency(data.totals.netIncome)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {!loading && data && data.properties.length === 0 && (
        <EmptyState
          icon={FileSpreadsheet}
          title="No data for this period"
          description="There are no transactions recorded for the selected year and property."
        />
      )}

      {/* Initial state */}
      {!loading && !data && (
        <EmptyState
          icon={FileSpreadsheet}
          title="Generate a report"
          description="Select a tax year and property, then click Generate Report."
        />
      )}
    </div>
  );
}
