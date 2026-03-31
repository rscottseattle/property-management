"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  propertyName: string;
  date: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  propertyName: string;
  date: string;
}

interface RecentActivityProps {
  transactions: Transaction[];
  maintenanceRequests: MaintenanceRequest[];
}

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "neutral"> = {
  SUBMITTED: "info",
  ACKNOWLEDGED: "info",
  SCHEDULED: "warning",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
};

const statusLabel: Record<string, string> = {
  SUBMITTED: "Submitted",
  ACKNOWLEDGED: "Acknowledged",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

function formatCategory(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function RecentActivity({
  transactions,
  maintenanceRequests,
}: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link
            href="/transactions"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No recent transactions.</p>
          ) : (
            <div className="space-y-1">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        t.type === "INCOME"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {t.type === "INCOME" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formatCategory(t.category)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {t.propertyName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p
                      className={`text-sm font-semibold ${
                        t.type === "INCOME"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateShort(t.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Updates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Maintenance Updates</CardTitle>
          <Link
            href="/maintenance"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {maintenanceRequests.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No recent maintenance requests.
            </p>
          ) : (
            <div className="space-y-1">
              {maintenanceRequests.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {m.propertyName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <Badge
                      variant={statusVariant[m.status] ?? "default"}
                      size="sm"
                      dot
                    >
                      {statusLabel[m.status] ?? m.status}
                    </Badge>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateShort(m.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
