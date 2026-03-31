"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, BarChart3, Download } from "lucide-react";
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
import { exportToCSV } from "@/lib/csv-export";

// ---------- Types ----------

interface MonthlyData {
  month: string; // e.g. "2026-01"
  monthLabel: string; // e.g. "January 2026"
  income: number;
  expenses: number;
  net: number;
}

interface CashFlowData {
  months: MonthlyData[];
  totalIncome: number;
  totalExpenses: number;
  totalNet: number;
}

// ---------- Helpers ----------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const startYear = now.getMonth() < 11 ? now.getFullYear() - 1 : now.getFullYear();
  const startMonth = (now.getMonth() + 1) % 12 + 1; // 12 months ago
  const startDate = `${startYear}-${String(startMonth).padStart(2, "0")}-01`;
  return { startDate, endDate };
}

const rangeOptions = [
  { value: "6", label: "Last 6 months" },
  { value: "12", label: "Last 12 months" },
  { value: "24", label: "Last 24 months" },
  { value: "ytd", label: "Year to date" },
];

function computeRange(rangeValue: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

  if (rangeValue === "ytd") {
    return { startDate: `${now.getFullYear()}-01-01`, endDate };
  }

  const months = Number(rangeValue);
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  return { startDate, endDate };
}

// ---------- Page ----------

export default function CashFlowPage() {
  const [range, setRange] = useState("12");
  const [propertyId, setPropertyId] = useState("all");
  const [properties, setProperties] = useState<
    { value: string; label: string }[]
  >([]);
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch properties
  useEffect(() => {
    async function load() {
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
      } catch {
        /* silent */
      }
    }
    load();
  }, []);

  async function fetchReport() {
    setLoading(true);
    try {
      const { startDate, endDate } = computeRange(range);
      const params = new URLSearchParams({ startDate, endDate, groupBy: "month" });
      if (propertyId !== "all") params.set("propertyId", propertyId);
      const res = await fetch(`/api/reports/financial-summary?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      // The API may return monthly data directly or we can process it
      // Expect shape: { months: [...], totalIncome, totalExpenses, totalNet }
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (!data) return;
    const rows = data.months.map((m) => ({
      Month: m.monthLabel,
      Income: m.income,
      Expenses: m.expenses,
      Net: m.net,
    }));
    rows.push({
      Month: "TOTAL",
      Income: data.totalIncome,
      Expenses: data.totalExpenses,
      Net: data.totalNet,
    });
    exportToCSV(rows, `cash-flow-report.csv`);
  }

  // Max for visual bars
  const maxVal = data
    ? Math.max(...data.months.map((m) => Math.max(m.income, m.expenses)), 1)
    : 1;

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
        <h1 className="text-2xl font-semibold text-gray-900">Cash Flow</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monthly income vs expense trend over time.
        </p>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-48">
            <Select
              label="Date Range"
              options={rangeOptions}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-56">
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
          <Button onClick={fetchReport} loading={loading} loadingText="Loading...">
            Generate
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {loading && <LoadingSkeleton variant="table" count={6} />}

      {/* Report */}
      {!loading && data && data.months.length > 0 && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Cash Flow</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="w-48 hidden md:table-cell">
                      Income vs Expense
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.months.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium text-gray-900">
                        {m.monthLabel}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        {formatCurrency(m.income)}
                      </TableCell>
                      <TableCell className="text-right text-red-700">
                        {formatCurrency(m.expenses)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          m.net >= 0 ? "text-blue-700" : "text-red-700"
                        }`}
                      >
                        {formatCurrency(m.net)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.round(
                                    (m.income / maxVal) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-red-400 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.round(
                                    (m.expenses / maxVal) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals row */}
                  <TableRow className="border-t-2 border-gray-300 bg-gray-50/50">
                    <TableCell className="font-bold text-gray-900">
                      Totals
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-700">
                      {formatCurrency(data.totalIncome)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-700">
                      {formatCurrency(data.totalExpenses)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        data.totalNet >= 0 ? "text-blue-700" : "text-red-700"
                      }`}
                    >
                      {formatCurrency(data.totalNet)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell" />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty */}
      {!loading && data && data.months.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No data for this period"
          description="There are no transactions recorded for the selected date range."
        />
      )}

      {/* Initial */}
      {!loading && !data && (
        <EmptyState
          icon={BarChart3}
          title="Generate a report"
          description="Select a date range and property, then click Generate."
        />
      )}
    </div>
  );
}
