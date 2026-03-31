"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Home,
  Users,
  BarChart3,
  DollarSign,
  Plus,
  CreditCard,
  Wrench,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  LoadingSkeleton,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AttentionItems } from "@/components/dashboard/AttentionItems";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

interface DashboardData {
  userName: string;
  portfolioStats: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    vacancyRate: number;
    totalMonthlyRent: number;
  };
  financialSummary: {
    currentMonth: { income: number; expenses: number; net: number };
    yearToDate: { income: number; expenses: number; net: number };
  };
  attentionItems: Array<{
    type: string;
    message: string;
    count: number;
    link: string;
    priority: "urgent" | "warning" | "info";
  }>;
  recentActivity: {
    transactions: Array<{
      id: string;
      type: "INCOME" | "EXPENSE";
      category: string;
      amount: number;
      propertyName: string;
      date: string;
    }>;
    maintenanceRequests: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      propertyName: string;
      date: string;
    }>;
  };
}

const statIcons = [Building2, Home, Users, BarChart3, DollarSign];
const statColors = [
  "text-[#d4856a] bg-[#fae8e3]",
  "text-[#5c7c65] bg-[#e8f0e9]",
  "text-[#7b9eb8] bg-[#e5eef5]",
  "text-[#c9a96e] bg-[#f5eddc]",
  "text-[#5c7c65] bg-[#e8f0e9]",
];

function vacancyColor(rate: number): string {
  if (rate <= 5) return "text-[#5c7c65]";
  if (rate <= 15) return "text-[#c9a96e]";
  return "text-[#d4856a]";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <LoadingSkeleton variant="text" width="280px" height="28px" />
        <div className="mt-2">
          <LoadingSkeleton variant="text" width="180px" height="16px" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" count={1} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton variant="card" count={1} />
        <LoadingSkeleton variant="card" count={1} />
      </div>
      <LoadingSkeleton variant="card" count={1} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton variant="card" count={1} />
        <LoadingSkeleton variant="card" count={1} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently fail — skeleton will remain
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { portfolioStats, financialSummary, attentionItems, recentActivity } =
    data;

  const stats = [
    {
      label: "Total Properties",
      value: String(portfolioStats.totalProperties),
    },
    {
      label: "Total Units",
      value: String(portfolioStats.totalUnits),
    },
    {
      label: "Occupied Units",
      value: String(portfolioStats.occupiedUnits),
    },
    {
      label: "Vacancy Rate",
      value: `${portfolioStats.vacancyRate}%`,
      valueClass: vacancyColor(portfolioStats.vacancyRate),
    },
    {
      label: "Monthly Rent",
      value: formatCurrency(portfolioStats.totalMonthlyRent),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {data.userName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(new Date())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            href="/properties/new"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Property
          </Button>
          <Button
            variant="outline"
            size="sm"
            href="/transactions/new"
            leftIcon={<CreditCard className="h-4 w-4" />}
          >
            Record Payment
          </Button>
          <Button
            variant="outline"
            size="sm"
            href="/maintenance/new"
            leftIcon={<Wrench className="h-4 w-4" />}
          >
            New Request
          </Button>
        </div>
      </div>

      {/* Portfolio Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = statIcons[i];
          return (
            <Card key={stat.label} padding="none">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${statColors[i]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p
                  className={`mt-3 text-2xl font-semibold ${stat.valueClass ?? "text-gray-900"}`}
                >
                  {stat.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialCard
          title="This Month"
          income={financialSummary.currentMonth.income}
          expenses={financialSummary.currentMonth.expenses}
          net={financialSummary.currentMonth.net}
        />
        <FinancialCard
          title="Year to Date"
          income={financialSummary.yearToDate.income}
          expenses={financialSummary.yearToDate.expenses}
          net={financialSummary.yearToDate.net}
        />
      </div>

      {/* Attention Items */}
      <AttentionItems items={attentionItems} />

      {/* Recent Activity */}
      <RecentActivity
        transactions={recentActivity.transactions}
        maintenanceRequests={recentActivity.maintenanceRequests}
      />
    </div>
  );
}

function FinancialCard({
  title,
  income,
  expenses,
  net,
}: {
  title: string;
  income: number;
  expenses: number;
  net: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Income</span>
            <span className="text-sm font-semibold text-[#5c7c65]">
              {formatCurrency(income)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Expenses</span>
            <span className="text-sm font-semibold text-[#d4856a]">
              {formatCurrency(expenses)}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Net</span>
              <span
                className={`text-base font-bold ${net >= 0 ? "text-[#5c7c65]" : "text-[#d4856a]"}`}
              >
                {formatCurrency(net)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
