"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Download, ArrowUpDown } from "lucide-react";
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
  Badge,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { exportToCSV } from "@/lib/csv-export";

// ---------- Types ----------

interface PropertyComparison {
  propertyId: string;
  propertyName: string;
  income: number;
  expenses: number;
  noi: number;
  capRate: number | null;
  occupancyRate: number;
  purchasePrice: number | null;
}

type SortField =
  | "propertyName"
  | "income"
  | "expenses"
  | "noi"
  | "capRate"
  | "occupancyRate";

// ---------- Helpers ----------

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const currentQuarter = Math.floor(currentMonth / 3);

type PeriodType = "month" | "quarter" | "year";

function getDateRange(
  periodType: PeriodType,
  year: number,
  periodIndex: number
): { startDate: string; endDate: string } {
  if (periodType === "year") {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }
  if (periodType === "quarter") {
    const startMonth = periodIndex * 3;
    const endMonth = startMonth + 2;
    const endDay = new Date(year, endMonth + 1, 0).getDate();
    return {
      startDate: `${year}-${String(startMonth + 1).padStart(2, "0")}-01`,
      endDate: `${year}-${String(endMonth + 1).padStart(2, "0")}-${endDay}`,
    };
  }
  const endDay = new Date(year, periodIndex + 1, 0).getDate();
  return {
    startDate: `${year}-${String(periodIndex + 1).padStart(2, "0")}-01`,
    endDate: `${year}-${String(periodIndex + 1).padStart(2, "0")}-${endDay}`,
  };
}

const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

const monthOptions = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const quarterOptions = [
  { value: "0", label: "Q1 (Jan - Mar)" },
  { value: "1", label: "Q2 (Apr - Jun)" },
  { value: "2", label: "Q3 (Jul - Sep)" },
  { value: "3", label: "Q4 (Oct - Dec)" },
];

// ---------- Page ----------

export default function PropertyComparisonPage() {
  const [periodType, setPeriodType] = useState<PeriodType>("year");
  const [year, setYear] = useState(String(currentYear));
  const [periodIndex, setPeriodIndex] = useState(String(currentQuarter));
  const [data, setData] = useState<PropertyComparison[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("noi");
  const [sortAsc, setSortAsc] = useState(false);

  async function fetchReport() {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(
        periodType,
        Number(year),
        Number(periodIndex)
      );
      const params = new URLSearchParams({
        startDate,
        endDate,
        compareProperties: "true",
      });
      const res = await fetch(`/api/reports/financial-summary?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      // Expect: { properties: PropertyComparison[] } or PropertyComparison[]
      setData(json.properties ?? json ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  const sortedData = data
    ? [...data].sort((a, b) => {
        const aVal = a[sortField] ?? -Infinity;
        const bVal = b[sortField] ?? -Infinity;
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortAsc
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortAsc
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      })
    : [];

  // Find best/worst NOI
  const bestNOI =
    sortedData.length > 0
      ? Math.max(...sortedData.map((p) => p.noi))
      : null;
  const worstNOI =
    sortedData.length > 0
      ? Math.min(...sortedData.map((p) => p.noi))
      : null;

  function handleExportCSV() {
    if (!data) return;
    const rows = data.map((p) => ({
      Property: p.propertyName,
      Income: p.income,
      Expenses: p.expenses,
      NOI: p.noi,
      "Cap Rate": p.capRate !== null ? `${p.capRate.toFixed(1)}%` : "N/A",
      "Occupancy Rate": `${p.occupancyRate}%`,
    }));
    exportToCSV(rows, `property-comparison-${year}.csv`);
  }

  function SortableHead({
    label,
    field,
    className,
  }: {
    label: string;
    field: SortField;
    className?: string;
  }) {
    return (
      <TableHead className={className}>
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
          onClick={() => handleSort(field)}
        >
          {label}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </TableHead>
    );
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
          Property Comparison
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Compare profitability across properties.
        </p>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-end gap-4 flex-wrap">
          <div className="w-full sm:w-36">
            <Select
              label="Period"
              options={[
                { value: "month", label: "Monthly" },
                { value: "quarter", label: "Quarterly" },
                { value: "year", label: "Yearly" },
              ]}
              value={periodType}
              onChange={(e) => {
                const val = e.target.value as PeriodType;
                setPeriodType(val);
                if (val === "year") setPeriodIndex("0");
                if (val === "quarter") setPeriodIndex(String(currentQuarter));
                if (val === "month") setPeriodIndex(String(currentMonth));
              }}
            />
          </div>
          <div className="w-full sm:w-36">
            <Select
              label="Year"
              options={yearOptions}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          {periodType === "month" && (
            <div className="w-full sm:w-44">
              <Select
                label="Month"
                options={monthOptions}
                value={periodIndex}
                onChange={(e) => setPeriodIndex(e.target.value)}
              />
            </div>
          )}
          {periodType === "quarter" && (
            <div className="w-full sm:w-44">
              <Select
                label="Quarter"
                options={quarterOptions}
                value={periodIndex}
                onChange={(e) => setPeriodIndex(e.target.value)}
              />
            </div>
          )}
          <Button onClick={fetchReport} loading={loading} loadingText="Loading...">
            Generate
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {loading && <LoadingSkeleton variant="table" count={4} />}

      {/* Report */}
      {!loading && data && data.length > 0 && (
        <div className="space-y-4">
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
            <CardContent className="px-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Property" field="propertyName" />
                    <SortableHead
                      label="Income"
                      field="income"
                      className="text-right"
                    />
                    <SortableHead
                      label="Expenses"
                      field="expenses"
                      className="text-right"
                    />
                    <SortableHead
                      label="NOI"
                      field="noi"
                      className="text-right"
                    />
                    <SortableHead
                      label="Cap Rate"
                      field="capRate"
                      className="text-right"
                    />
                    <SortableHead
                      label="Occupancy"
                      field="occupancyRate"
                      className="text-right"
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((prop) => {
                    const isBest =
                      sortedData.length > 1 && prop.noi === bestNOI;
                    const isWorst =
                      sortedData.length > 1 && prop.noi === worstNOI;

                    return (
                      <TableRow key={prop.propertyId} hoverable>
                        <TableCell className="font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {prop.propertyName}
                            {isBest && (
                              <Badge variant="success" size="sm">
                                Best
                              </Badge>
                            )}
                            {isWorst && (
                              <Badge variant="danger" size="sm">
                                Worst
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-green-700 font-medium">
                          {formatCurrency(prop.income)}
                        </TableCell>
                        <TableCell className="text-right text-red-700 font-medium">
                          {formatCurrency(prop.expenses)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            prop.noi >= 0 ? "text-blue-700" : "text-red-700"
                          }`}
                        >
                          {formatCurrency(prop.noi)}
                        </TableCell>
                        <TableCell className="text-right">
                          {prop.capRate !== null
                            ? `${prop.capRate.toFixed(1)}%`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          {prop.occupancyRate}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty */}
      {!loading && data && data.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No properties to compare"
          description="Add properties and record transactions to see a comparison."
        />
      )}

      {/* Initial */}
      {!loading && !data && (
        <EmptyState
          icon={Building2}
          title="Generate a comparison"
          description="Select a period, then click Generate to compare properties."
        />
      )}
    </div>
  );
}
