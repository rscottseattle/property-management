"use client";

import { Card, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, AlertCircle, Percent } from "lucide-react";

interface RentRollSummaryProps {
  totalExpected: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
}

const stats = [
  {
    key: "expected",
    label: "Total Expected",
    icon: DollarSign,
    color: "text-[#7b9eb8]",
    bgColor: "bg-[#e5eef5]",
    borderColor: "border-[#c5d8e8]",
  },
  {
    key: "collected",
    label: "Total Collected",
    icon: TrendingUp,
    color: "text-[#5c7c65]",
    bgColor: "bg-[#e8f0e9]",
    borderColor: "border-[#c2d6c6]",
  },
  {
    key: "outstanding",
    label: "Outstanding",
    icon: AlertCircle,
    color: "text-[#d4856a]",
    bgColor: "bg-[#fae8e3]",
    borderColor: "border-[#f0d4cb]",
  },
  {
    key: "rate",
    label: "Collection Rate",
    icon: Percent,
    color: "text-[#c9a96e]",
    bgColor: "bg-[#f5eddc]",
    borderColor: "border-[#e5d9b8]",
  },
] as const;

export function RentRollSummary({
  totalExpected,
  totalCollected,
  outstanding,
  collectionRate,
}: RentRollSummaryProps) {
  const values: Record<string, string> = {
    expected: formatCurrency(totalExpected),
    collected: formatCurrency(totalCollected),
    outstanding: formatCurrency(outstanding),
    rate: `${collectionRate.toFixed(1)}%`,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.key} className={cn("border", stat.borderColor)}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    stat.bgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className={cn("text-lg font-semibold", stat.color)}>
                    {values[stat.key]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
