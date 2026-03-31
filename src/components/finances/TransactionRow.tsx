"use client";

import { ArrowUpCircle, ArrowDownCircle, Receipt } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { INCOME_CATEGORIES, SCHEDULE_E_CATEGORIES } from "@/lib/constants";

export interface TransactionData {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number | string;
  date: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  payee?: string | null;
  payer?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  property?: {
    id: string;
    name: string;
  } | null;
}

interface TransactionRowProps {
  transaction: TransactionData;
  onClick?: (transaction: TransactionData) => void;
  compact?: boolean;
}

function getCategoryLabel(category: string, type: "INCOME" | "EXPENSE"): string {
  const categories = type === "INCOME" ? INCOME_CATEGORIES : SCHEDULE_E_CATEGORIES;
  const found = categories.find((c) => c.value === category);
  return found?.label ?? category;
}

function getStatusBadge(status: TransactionData["status"]) {
  const config = {
    COMPLETED: { variant: "success" as const, label: "Completed" },
    PENDING: { variant: "warning" as const, label: "Pending" },
    CANCELLED: { variant: "neutral" as const, label: "Cancelled" },
  };
  const { variant, label } = config[status];
  return (
    <Badge variant={variant} size="sm" dot>
      {label}
    </Badge>
  );
}

export function TransactionRow({ transaction, onClick, compact = false }: TransactionRowProps) {
  const isIncome = transaction.type === "INCOME";
  const amount = Number(transaction.amount);
  const categoryLabel = getCategoryLabel(transaction.category, transaction.type);
  const description = transaction.payee || transaction.payer || transaction.notes || categoryLabel;

  // Card layout for mobile / compact mode
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(transaction)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isIncome ? (
              <ArrowUpCircle className="h-5 w-5 text-green-500 shrink-0" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-red-500 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {description}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(transaction.date)}
                {transaction.property && ` \u00B7 ${transaction.property.name}`}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                "text-sm font-semibold",
                isIncome ? "text-green-700" : "text-red-700"
              )}
            >
              {isIncome ? "" : "-"}{formatCurrency(amount)}
            </p>
            <div className="mt-0.5">{getStatusBadge(transaction.status)}</div>
          </div>
        </div>
      </button>
    );
  }

  // Table row layout for desktop
  return (
    <tr
      onClick={() => onClick?.(transaction)}
      className={cn(
        "border-b border-gray-100 transition-colors",
        onClick && "hover:bg-gray-50 cursor-pointer"
      )}
    >
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {formatDate(transaction.date)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isIncome ? (
            <ArrowUpCircle className="h-4 w-4 text-green-500 shrink-0" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <span className="text-xs font-medium text-gray-500 uppercase">
            {isIncome ? "Income" : "Expense"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {categoryLabel}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
        {description}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {transaction.property?.name ?? "\u2014"}
      </td>
      <td
        className={cn(
          "px-4 py-3 text-sm font-semibold whitespace-nowrap text-right",
          isIncome ? "text-green-700" : "text-red-700"
        )}
      >
        {isIncome ? "" : "-"}{formatCurrency(amount)}
      </td>
      <td className="px-4 py-3">{getStatusBadge(transaction.status)}</td>
      <td className="px-4 py-3 text-center">
        {transaction.receiptUrl && (
          <Receipt className="h-4 w-4 text-gray-400 inline-block" />
        )}
      </td>
    </tr>
  );
}
