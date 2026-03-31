"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  DollarSign,
  Percent,
  TrendingUp,
  BarChart3,
  Download,
  Calendar,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
  LoadingSkeleton,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

// ---------- Types ----------

interface STRAnalytics {
  totalRevenue: number;
  occupancyRate: number;
  adr: number;
  revpan: number;
  revenueByUnit: {
    unitId: string;
    unitLabel: string;
    propertyName: string;
    revenue: number;
    nights: number;
    bookings: number;
  }[];
  revenueByPlatform: {
    platform: string;
    revenue: number;
    bookings: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
    bookings: number;
    nights: number;
  }[];
}

// ---------- KPI Card ----------

function KPICard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ---------- Platform color helper ----------

const PLATFORM_COLORS: Record<string, string> = {
  AIRBNB: "bg-pink-100 text-pink-700",
  VRBO: "bg-blue-100 text-blue-700",
  DIRECT: "bg-green-100 text-green-700",
  OTHER: "bg-gray-100 text-gray-700",
};

function platformLabel(p: string): string {
  if (p === "AIRBNB") return "Airbnb";
  if (p === "VRBO") return "VRBO";
  if (p === "DIRECT") return "Direct";
  return "Other";
}

// ---------- Main Page ----------

export default function STRAnalyticsPage() {
  const [analytics, setAnalytics] = useState<STRAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<{ id: string; label: string; propertyName: string }[]>([]);
  const [unitFilter, setUnitFilter] = useState("ALL");

  // Date range: default to current year
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  // Fetch analytics
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const params = new URLSearchParams();
        params.set("startDate", startDate);
        params.set("endDate", endDate);
        if (unitFilter !== "ALL") params.set("unitId", unitFilter);

        const res = await fetch(`/api/reports/str-analytics?${params}`);
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        setAnalytics(data);

        // Extract units from data
        if (data.revenueByUnit) {
          setUnits(
            data.revenueByUnit.map((u: { unitId: string; unitLabel: string; propertyName: string }) => ({
              id: u.unitId,
              label: u.unitLabel,
              propertyName: u.propertyName,
            }))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    setError(null);
    fetchAnalytics();
  }, [startDate, endDate, unitFilter]);

  // Export CSV
  function exportCSV() {
    if (!analytics) return;

    const rows: string[][] = [
      ["STR Analytics Report"],
      [`Date Range: ${startDate} to ${endDate}`],
      [],
      ["KPI", "Value"],
      ["Total Revenue", formatCurrency(analytics.totalRevenue)],
      ["Occupancy Rate", `${analytics.occupancyRate.toFixed(1)}%`],
      ["ADR", formatCurrency(analytics.adr)],
      ["RevPAN", formatCurrency(analytics.revpan)],
      [],
      ["Revenue by Unit"],
      ["Property", "Unit", "Revenue", "Nights", "Bookings"],
      ...analytics.revenueByUnit.map((u) => [
        u.propertyName,
        u.unitLabel,
        formatCurrency(u.revenue),
        String(u.nights),
        String(u.bookings),
      ]),
      [],
      ["Revenue by Platform"],
      ["Platform", "Revenue", "Bookings"],
      ...analytics.revenueByPlatform.map((p) => [
        platformLabel(p.platform),
        formatCurrency(p.revenue),
        String(p.bookings),
      ]),
      [],
      ["Revenue by Month"],
      ["Month", "Revenue", "Bookings", "Nights"],
      ...analytics.revenueByMonth.map((m) => [
        m.month,
        formatCurrency(m.revenue),
        String(m.bookings),
        String(m.nights),
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `str-analytics-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            href="/reports"
          >
            Reports
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              STR Analytics
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Short-term rental performance metrics and revenue analysis.
            </p>
          </div>
        </div>
        {analytics && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={exportCSV}
          >
            Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {units.length > 0 && (
            <Select
              options={[
                { value: "ALL", label: "All Units" },
                ...units.map((u) => ({
                  value: u.id,
                  label: `${u.propertyName} - ${u.label}`,
                })),
              ]}
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-52"
            />
          )}
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="card" count={1} />
            ))}
          </div>
          <LoadingSkeleton variant="card" count={3} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card padding="lg">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </Card>
      )}

      {/* Analytics content */}
      {!loading && !error && analytics && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Total Revenue"
              value={formatCurrency(analytics.totalRevenue)}
              icon={DollarSign}
              color="bg-green-50 text-green-600"
            />
            <KPICard
              label="Occupancy Rate"
              value={`${analytics.occupancyRate.toFixed(1)}%`}
              icon={Percent}
              color="bg-blue-50 text-blue-600"
            />
            <KPICard
              label="ADR"
              value={formatCurrency(analytics.adr)}
              icon={TrendingUp}
              color="bg-purple-50 text-purple-600"
            />
            <KPICard
              label="RevPAN"
              value={formatCurrency(analytics.revpan)}
              icon={BarChart3}
              color="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Revenue by Unit */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Unit</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.revenueByUnit.length === 0 ? (
                <p className="text-sm text-gray-500">No unit data available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50/50">
                      <tr>
                        <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Property
                        </th>
                        <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Nights
                        </th>
                        <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Bookings
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.revenueByUnit.map((u) => (
                        <tr
                          key={u.unitId}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-3 text-gray-700">
                            {u.propertyName}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {u.unitLabel}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            {formatCurrency(u.revenue)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {u.nights}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {u.bookings}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Platform */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.revenueByPlatform.length === 0 ? (
                <p className="text-sm text-gray-500">No platform data available.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.revenueByPlatform.map((p) => {
                    const pct =
                      analytics.totalRevenue > 0
                        ? (p.revenue / analytics.totalRevenue) * 100
                        : 0;
                    const colorClass = PLATFORM_COLORS[p.platform] ?? PLATFORM_COLORS.OTHER;
                    return (
                      <div key={p.platform} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
                            >
                              {platformLabel(p.platform)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {p.bookings} booking{p.bookings !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(p.revenue)}{" "}
                            <span className="text-gray-400 font-normal">
                              ({pct.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.platform === "AIRBNB"
                                ? "bg-pink-400"
                                : p.platform === "VRBO"
                                ? "bg-blue-400"
                                : p.platform === "DIRECT"
                                ? "bg-green-400"
                                : "bg-gray-400"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Month</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.revenueByMonth.length === 0 ? (
                <p className="text-sm text-gray-500">No monthly data available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50/50">
                      <tr>
                        <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Month
                        </th>
                        <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Bookings
                        </th>
                        <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                          Nights
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.revenueByMonth.map((m) => (
                        <tr
                          key={m.month}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {m.month}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            {formatCurrency(m.revenue)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {m.bookings}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {m.nights}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
