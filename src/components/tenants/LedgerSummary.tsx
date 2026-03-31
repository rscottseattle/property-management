"use client";

import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Receipt,
  Banknote,
  Gift,
  Wallet,
} from "lucide-react";

interface LedgerSummaryProps {
  totalCharges: number;
  totalPayments: number;
  totalCredits: number;
  currentBalance: number;
}

const cards = [
  {
    key: "charges",
    label: "Total Charges",
    icon: Receipt,
    bgColor: "bg-[#e5eef5]",
    iconColor: "text-[#7b9eb8]",
    valueColor: "text-gray-900",
  },
  {
    key: "payments",
    label: "Total Payments",
    icon: Banknote,
    bgColor: "bg-[#e8f0e9]",
    iconColor: "text-[#5c7c65]",
    valueColor: "text-gray-900",
  },
  {
    key: "credits",
    label: "Credits / Adjustments",
    icon: Gift,
    bgColor: "bg-[#f5eddc]",
    iconColor: "text-[#c9a96e]",
    valueColor: "text-gray-900",
  },
  {
    key: "balance",
    label: "Current Balance",
    icon: Wallet,
    bgColor: "", // dynamic
    iconColor: "", // dynamic
    valueColor: "", // dynamic
  },
] as const;

export function LedgerSummary({
  totalCharges,
  totalPayments,
  totalCredits,
  currentBalance,
}: LedgerSummaryProps) {
  const values: Record<string, number> = {
    charges: totalCharges,
    payments: totalPayments,
    credits: totalCredits,
    balance: currentBalance,
  };

  const balanceOwed = currentBalance > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isBalance = card.key === "balance";

        const bgColor = isBalance
          ? balanceOwed
            ? "bg-[#fae8e3]"
            : "bg-[#e8f0e9]"
          : card.bgColor;
        const iconColor = isBalance
          ? balanceOwed
            ? "text-[#c75a3a]"
            : "text-[#5c7c65]"
          : card.iconColor;
        const valueColor = isBalance
          ? balanceOwed
            ? "text-[#c75a3a]"
            : "text-[#5c7c65]"
          : card.valueColor;

        return (
          <Card key={card.key} padding="md">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2.5", bgColor)}>
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className={cn("text-lg font-semibold", valueColor)}>
                  {formatCurrency(values[card.key])}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
