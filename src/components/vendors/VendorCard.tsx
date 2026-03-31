"use client";

import { Phone, Mail, Briefcase, DollarSign } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { StarRating } from "@/components/vendors/StarRating";
import { formatCurrency } from "@/lib/utils";

const TRADE_COLORS: Record<string, { bg: string; text: string }> = {
  Plumber: { bg: "bg-[#e5eef5]", text: "text-[#4a6f8a]" },
  Electrician: { bg: "bg-[#f5eddc]", text: "text-[#8a6d2f]" },
  HVAC: { bg: "bg-[#e5eef5]", text: "text-[#4a6f8a]" },
  "General Contractor": { bg: "bg-gray-100", text: "text-gray-700" },
  Painter: { bg: "bg-[#f5eddc]", text: "text-[#8a6d2f]" },
  Landscaper: { bg: "bg-[#e8f0e9]", text: "text-[#3d5e44]" },
  Cleaner: { bg: "bg-[#e8f0e9]", text: "text-[#3d5e44]" },
  Roofer: { bg: "bg-[#fae8e3]", text: "text-[#a04025]" },
  "Appliance Repair": { bg: "bg-[#fae8e3]", text: "text-[#a04025]" },
  Locksmith: { bg: "bg-[#e5eef5]", text: "text-[#4a6f8a]" },
  "Pest Control": { bg: "bg-[#fae8e3]", text: "text-[#a04025]" },
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
              className="text-xs text-gray-500 hover:text-[#5c7c65] flex items-center gap-1.5 truncate"
            >
              <Phone className="h-3 w-3 shrink-0" />
              {vendor.phone}
            </a>
          )}
          {vendor.email && (
            <a
              href={`mailto:${vendor.email}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-500 hover:text-[#5c7c65] flex items-center gap-1.5 truncate"
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
