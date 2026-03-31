"use client";

import { Calendar, Moon, DollarSign, Sparkles } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface BookingCardData {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  nightlyRate: number | string;
  totalAmount: number | string;
  status: "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  platform: string | null;
  confirmationNumber: string | null;
  notes: string | null;
  guest: {
    id: string;
    name: string;
  };
  unit: {
    id: string;
    label: string;
    property: {
      id: string;
      name: string;
    };
  };
  cleaningTask?: {
    id: string;
    status: string;
  } | null;
}

const PLATFORM_COLORS: Record<string, string> = {
  AIRBNB: "bg-[#fae8e3] text-[#a04025]",
  VRBO: "bg-[#e5eef5] text-[#4a6f8a]",
  DIRECT: "bg-[#e8f0e9] text-[#3d5e44]",
  OTHER: "bg-gray-100 text-gray-700",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "info" | "success" | "neutral" | "warning" }
> = {
  CONFIRMED: { label: "Confirmed", variant: "info" },
  CHECKED_IN: { label: "Checked In", variant: "success" },
  CHECKED_OUT: { label: "Checked Out", variant: "neutral" },
  CANCELLED: { label: "Cancelled", variant: "warning" },
};

const CLEANING_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Cleaning Pending", color: "text-[#c9a96e]" },
  IN_PROGRESS: { label: "Cleaning In Progress", color: "text-[#7b9eb8]" },
  COMPLETED: { label: "Cleaning Done", color: "text-[#5c7c65]" },
  INSPECTED: { label: "Inspected", color: "text-[#3d5e44]" },
};

function getNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

export function PlatformBadge({ platform }: { platform: string | null }) {
  if (!platform) return null;
  const colorClass = PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.OTHER;
  const label = platform === "AIRBNB" ? "Airbnb" : platform === "VRBO" ? "VRBO" : platform === "DIRECT" ? "Direct" : "Other";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "neutral" as const };
  return (
    <Badge variant={config.variant} size="sm" dot>
      {config.label}
    </Badge>
  );
}

export default function BookingCard({
  booking,
  onClick,
}: {
  booking: BookingCardData;
  onClick?: () => void;
}) {
  const nights = getNights(booking.checkInDate, booking.checkOutDate);
  const cleaningStatus = booking.cleaningTask?.status
    ? CLEANING_STATUS_CONFIG[booking.cleaningTask.status]
    : null;

  return (
    <Card hover className="cursor-pointer" onClick={onClick}>
      <div className="p-5 space-y-3">
        {/* Header: guest name + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {booking.guest.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {booking.unit.property.name} &mdash; {booking.unit.label}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <PlatformBadge platform={booking.platform} />
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Dates + nights */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            {formatDate(booking.checkInDate)} &rarr; {formatDate(booking.checkOutDate)}
          </span>
          <span className="flex items-center gap-1">
            <Moon className="h-3.5 w-3.5 text-gray-400" />
            {nights} night{nights !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Pricing + cleaning */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatCurrency(Number(booking.nightlyRate))}/night
            </span>
            <span className="font-medium text-gray-700">
              {formatCurrency(Number(booking.totalAmount))} total
            </span>
          </div>
          {cleaningStatus && (
            <span className={`flex items-center gap-1 text-xs ${cleaningStatus.color}`}>
              <Sparkles className="h-3 w-3" />
              {cleaningStatus.label}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
