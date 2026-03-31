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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    key: "collected",
    label: "Total Collected",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    key: "outstanding",
    label: "Outstanding",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    key: "rate",
    label: "Collection Rate",
    icon: Percent,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
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
                    "flex h-10 w-10 items-center justify-center rounded-lg",
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
