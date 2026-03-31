"use client";

import { Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Tag, AlertTriangle, CheckCircle, Gift } from "lucide-react";

export type LedgerEntryType = "RENT" | "LATE_FEE" | "PAYMENT" | "CREDIT";

export interface LedgerEntryData {
  id: string;
  date: string;
  type: LedgerEntryType;
  description: string;
  chargeAmount: number | null;
  paymentAmount: number | null;
  runningBalance: number;
}

interface LedgerEntryProps {
  entry: LedgerEntryData;
}

const typeConfig: Record<
  LedgerEntryType,
  {
    label: string;
    variant: "info" | "warning" | "success" | "default";
    icon: typeof Tag;
  }
> = {
  RENT: { label: "Rent", variant: "info", icon: Tag },
  LATE_FEE: { label: "Late Fee", variant: "warning", icon: AlertTriangle },
  PAYMENT: { label: "Payment", variant: "success", icon: CheckCircle },
  CREDIT: { label: "Credit", variant: "default", icon: Gift },
};

export function LedgerEntry({ entry }: LedgerEntryProps) {
  const config = typeConfig[entry.type] ?? typeConfig.RENT;
  const Icon = config.icon;
  const balancePositive = entry.runningBalance > 0;

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
      <td className="px-4 py-3 align-middle text-sm text-gray-700 whitespace-nowrap">
        {formatDate(entry.date)}
      </td>
      <td className="px-4 py-3 align-middle">
        <Badge variant={config.variant} size="sm">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </td>
      <td className="px-4 py-3 align-middle text-sm text-gray-700">
        {entry.description}
      </td>
      <td className="px-4 py-3 align-middle text-sm text-right text-gray-700 whitespace-nowrap">
        {entry.chargeAmount != null && entry.chargeAmount > 0
          ? formatCurrency(entry.chargeAmount)
          : ""}
      </td>
      <td className="px-4 py-3 align-middle text-sm text-right text-[#5c7c65] whitespace-nowrap">
        {entry.paymentAmount != null && entry.paymentAmount > 0
          ? formatCurrency(entry.paymentAmount)
          : ""}
      </td>
      <td
        className={cn(
          "px-4 py-3 align-middle text-sm text-right font-medium whitespace-nowrap",
          balancePositive ? "text-[#c75a3a]" : "text-[#5c7c65]"
        )}
      >
        {formatCurrency(entry.runningBalance)}
      </td>
    </tr>
  );
}

/** Mobile card variant for responsive layout */
export function LedgerEntryCard({ entry }: LedgerEntryProps) {
  const config = typeConfig[entry.type] ?? typeConfig.RENT;
  const Icon = config.icon;
  const balancePositive = entry.runningBalance > 0;

  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
        <Badge variant={config.variant} size="sm">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>
      <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          {entry.chargeAmount != null && entry.chargeAmount > 0 && (
            <span className="text-gray-700">
              Charge: {formatCurrency(entry.chargeAmount)}
            </span>
          )}
          {entry.paymentAmount != null && entry.paymentAmount > 0 && (
            <span className="text-[#5c7c65]">
              Payment: {formatCurrency(entry.paymentAmount)}
            </span>
          )}
        </div>
        <span
          className={cn(
            "font-medium",
            balancePositive ? "text-[#c75a3a]" : "text-[#5c7c65]"
          )}
        >
          {formatCurrency(entry.runningBalance)}
        </span>
      </div>
    </div>
  );
}
