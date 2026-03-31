"use client";

import { DollarSign, TrendingDown, Calculator, Clock } from "lucide-react";
import { Card } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

interface FinancialSummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  pendingCount: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-lg p-2.5", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className={cn("text-lg font-semibold truncate", valueColor ?? "text-gray-900")}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function FinancialSummaryCards({
  totalIncome,
  totalExpenses,
  netIncome,
  pendingCount,
}: FinancialSummaryCardsProps) {
  const netIsPositive = netIncome >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Income"
        value={formatCurrency(totalIncome)}
        icon={DollarSign}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        valueColor="text-green-700"
      />
      <StatCard
        label="Total Expenses"
        value={formatCurrency(totalExpenses)}
        icon={TrendingDown}
        iconBg="bg-red-50"
        iconColor="text-red-600"
        valueColor="text-red-700"
      />
      <StatCard
        label="Net Income"
        value={formatCurrency(netIncome)}
        icon={Calculator}
        iconBg={netIsPositive ? "bg-blue-50" : "bg-red-50"}
        iconColor={netIsPositive ? "text-blue-600" : "text-red-600"}
        valueColor={netIsPositive ? "text-blue-700" : "text-red-700"}
      />
      <StatCard
        label="Pending"
        value={String(pendingCount)}
        icon={Clock}
        iconBg="bg-yellow-50"
        iconColor="text-yellow-600"
        valueColor="text-yellow-700"
      />
    </div>
  );
}
