"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Wrench,
  Home,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export interface AttentionItem {
  type: string;
  message: string;
  count: number;
  link: string;
  priority: "urgent" | "warning" | "info";
}

interface AttentionItemsProps {
  items: AttentionItem[];
}

const iconMap: Record<string, typeof AlertTriangle> = {
  overdue_rent: AlertTriangle,
  expiring_leases: Clock,
  open_maintenance: Wrench,
  vacant_units: Home,
};

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-50 border-red-200",
  warning: "bg-amber-50 border-amber-200",
  info: "bg-white border-gray-200",
};

const iconStyles: Record<string, string> = {
  urgent: "text-red-600",
  warning: "text-amber-600",
  info: "text-gray-500",
};

export function AttentionItems({ items }: AttentionItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs Attention</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 py-4 text-green-700">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">
              All good! No items need attention.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const Icon = iconMap[item.type] ?? AlertTriangle;
              return (
                <Link
                  key={item.type}
                  href={item.link}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors hover:opacity-80 ${priorityStyles[item.priority]}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-5 w-5 shrink-0 ${iconStyles[item.priority]}`}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {item.message}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-gray-900 text-white text-xs font-semibold px-2">
                      {item.count}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
