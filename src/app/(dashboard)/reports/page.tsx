"use client";

import Link from "next/link";
import {
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  Building2,
  Car,
  ArrowRight,
} from "lucide-react";

const REPORT_CARDS = [
  {
    title: "Schedule E Report",
    description: "Generate IRS Schedule E report by property for any tax year",
    icon: FileSpreadsheet,
    href: "/reports/schedule-e",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Income Statement",
    description: "Income and expense breakdown by property and period",
    icon: TrendingUp,
    href: "/reports/income-statement",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Cash Flow",
    description: "Monthly income vs expense trend over time",
    icon: BarChart3,
    href: "/reports/cash-flow",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Property Comparison",
    description: "Compare profitability across properties",
    icon: Building2,
    href: "/reports/property-comparison",
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Mileage Log",
    description: "Track mileage for property visits",
    icon: Car,
    href: "/reports/mileage",
    color: "bg-teal-100 text-teal-600",
  },
] as const;

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          View financial reports and portfolio analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-lg border border-gray-200 bg-white shadow-sm p-6 transition-shadow hover:shadow-md flex items-start gap-4"
            >
              <div
                className={`shrink-0 rounded-full p-3 ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{card.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors mt-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
