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
        <div className={cn("rounded-full h-10 w-10 flex items-center justify-center", iconBg)}>
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
        iconBg="bg-[#e8f0e9]"
        iconColor="text-[#5c7c65]"
        valueColor="text-[#5c7c65]"
      />
      <StatCard
        label="Total Expenses"
        value={formatCurrency(totalExpenses)}
        icon={TrendingDown}
        iconBg="bg-[#fae8e3]"
        iconColor="text-[#d4856a]"
        valueColor="text-[#d4856a]"
      />
      <StatCard
        label="Net Income"
        value={formatCurrency(netIncome)}
        icon={Calculator}
        iconBg={netIsPositive ? "bg-[#e8f0e9]" : "bg-[#fae8e3]"}
        iconColor={netIsPositive ? "text-[#5c7c65]" : "text-[#d4856a]"}
        valueColor={netIsPositive ? "text-[#5c7c65]" : "text-[#d4856a]"}
      />
      <StatCard
        label="Pending"
        value={String(pendingCount)}
        icon={Clock}
        iconBg="bg-[#f5eddc]"
        iconColor="text-[#c9a96e]"
        valueColor="text-[#c9a96e]"
      />
    </div>
  );
}
