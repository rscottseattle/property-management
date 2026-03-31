"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Download, TrendingUp } from "lucide-react";
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

interface CategorySummary {
  category: string;
  label: string;
  amount: number;
}

interface IncomeStatementData {
  income: CategorySummary[];
  expenses: CategorySummary[];
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

type PeriodType = "month" | "quarter" | "year";

// ---------- Helpers ----------

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-indexed

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
  // month
  const endDay = new Date(year, periodIndex + 1, 0).getDate();
  return {
    startDate: `${year}-${String(periodIndex + 1).padStart(2, "0")}-01`,
    endDate: `${year}-${String(periodIndex + 1).padStart(2, "0")}-${endDay}`,
  };
}

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

const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

// ---------- Page ----------

export default function IncomeStatementPage() {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [year, setYear] = useState(String(currentYear));
  const [periodIndex, setPeriodIndex] = useState(String(currentMonth));
  const [propertyId, setPropertyId] = useState("all");
  const [properties, setProperties] = useState<
    { value: string; label: string }[]
  >([]);
  const [data, setData] = useState<IncomeStatementData | null>(null);
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

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(
        periodType,
        Number(year),
        Number(periodIndex)
      );
      const params = new URLSearchParams({ startDate, endDate });
      if (propertyId !== "all") params.set("propertyId", propertyId);
      const res = await fetch(`/api/reports/financial-summary?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [periodType, year, periodIndex, propertyId]);

  function handleExportCSV() {
    if (!data) return;
    const rows: Record<string, unknown>[] = [];

    for (const item of data.income) {
      rows.push({ Type: "Income", Category: item.label, Amount: item.amount });
    }
    rows.push({ Type: "Income", Category: "TOTAL INCOME", Amount: data.totalIncome });

    for (const item of data.expenses) {
      rows.push({ Type: "Expense", Category: item.label, Amount: item.amount });
    }
    rows.push({ Type: "Expense", Category: "TOTAL EXPENSES", Amount: data.totalExpenses });
    rows.push({ Type: "Net", Category: "NET INCOME", Amount: data.netIncome });

    exportToCSV(rows, `income-statement-${year}.csv`);
  }

  // Compute max for proportion bars
  const maxAmount = data
    ? Math.max(
        ...data.income.map((i) => i.amount),
        ...data.expenses.map((e) => e.amount),
        1
      )
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
        <h1 className="text-2xl font-semibold text-gray-900">
          Income Statement
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Income and expense breakdown by property and period.
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
                if (val === "quarter")
                  setPeriodIndex(String(Math.floor(currentMonth / 3)));
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
      {loading && <LoadingSkeleton variant="card" count={2} />}

      {/* Report */}
      {!loading && data && (
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

          {/* Income section */}
          <Card>
            <CardHeader>
              <CardTitle>Income</CardTitle>
            </CardHeader>
            <CardContent>
              {data.income.length === 0 ? (
                <p className="text-sm text-gray-500">No income recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right w-32">Amount</TableHead>
                      <TableHead className="w-48 hidden sm:table-cell">
                        Proportion
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.income.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell className="text-right font-medium text-green-700">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${Math.round(
                                  (item.amount / maxAmount) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold text-gray-900">
                        Total Income
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-700">
                        {formatCurrency(data.totalIncome)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Expenses section */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {data.expenses.length === 0 ? (
                <p className="text-sm text-gray-500">No expenses recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right w-32">Amount</TableHead>
                      <TableHead className="w-48 hidden sm:table-cell">
                        Proportion
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expenses.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell className="text-right font-medium text-red-700">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-red-400 h-2 rounded-full"
                              style={{
                                width: `${Math.round(
                                  (item.amount / maxAmount) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold text-gray-900">
                        Total Expenses
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-700">
                        {formatCurrency(data.totalExpenses)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Net Income */}
          <Card padding="md">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">
                Net Income
              </span>
              <span
                className={`text-lg font-bold ${
                  data.netIncome >= 0 ? "text-blue-700" : "text-red-700"
                }`}
              >
                {formatCurrency(data.netIncome)}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Initial state */}
      {!loading && !data && (
        <EmptyState
          icon={TrendingUp}
          title="Generate a report"
          description="Select a period and property, then click Generate."
        />
      )}
    </div>
  );
}
