"use client";

import { Phone, Mail, Briefcase, DollarSign } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { StarRating } from "@/components/vendors/StarRating";
import { formatCurrency } from "@/lib/utils";

const TRADE_COLORS: Record<string, { bg: string; text: string }> = {
  Plumber: { bg: "bg-blue-50", text: "text-blue-700" },
  Electrician: { bg: "bg-yellow-50", text: "text-yellow-700" },
  HVAC: { bg: "bg-cyan-50", text: "text-cyan-700" },
  "General Contractor": { bg: "bg-gray-100", text: "text-gray-700" },
  Painter: { bg: "bg-purple-50", text: "text-purple-700" },
  Landscaper: { bg: "bg-green-50", text: "text-green-700" },
  Cleaner: { bg: "bg-teal-50", text: "text-teal-700" },
  Roofer: { bg: "bg-orange-50", text: "text-orange-700" },
  "Appliance Repair": { bg: "bg-rose-50", text: "text-rose-700" },
  Locksmith: { bg: "bg-indigo-50", text: "text-indigo-700" },
  "Pest Control": { bg: "bg-red-50", text: "text-red-700" },
  Other: { bg: "bg-gray-50", text: "text-gray-600" },
};

export interface VendorCardProps {
  vendor: {
    id: string;
    name: string;
    trade: string;
    phone: string | null;
    email: string | null;
    rating: number | null;
    jobCount: number;
    totalSpend: number;
  };
  onClick?: () => void;
}

export function VendorCard({ vendor, onClick }: VendorCardProps) {
  const tradeColor = TRADE_COLORS[vendor.trade] ?? TRADE_COLORS.Other;

  return (
    <Card hover className="cursor-pointer" onClick={onClick}>
      <div className="p-5 space-y-3">
        {/* Header: name + trade badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {vendor.name}
            </h3>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${tradeColor.bg} ${tradeColor.text}`}
          >
            {vendor.trade}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          {vendor.rating ? (
            <StarRating value={vendor.rating} size="sm" />
          ) : (
            <span className="text-xs text-gray-400">Not rated</span>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-1">
          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1.5 truncate"
            >
              <Phone className="h-3 w-3 shrink-0" />
              {vendor.phone}
            </a>
          )}
          {vendor.email && (
            <a
              href={`mailto:${vendor.email}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1.5 truncate"
            >
              <Mail className="h-3 w-3 shrink-0" />
              {vendor.email}
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {vendor.jobCount} job{vendor.jobCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1 font-medium text-gray-700">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(vendor.totalSpend)}
          </span>
        </div>
      </div>
    </Card>
  );
}
