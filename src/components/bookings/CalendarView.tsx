"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface CalendarBooking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  platform: string | null;
  guest: {
    name: string;
  };
  unit: {
    label: string;
    property: {
      name: string;
    };
  };
}

interface CalendarViewProps {
  bookings: CalendarBooking[];
  month: Date;
  onMonthChange: (date: Date) => void;
  onBookingClick: (bookingId: string) => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PLATFORM_COLORS: Record<string, string> = {
  AIRBNB: "bg-pink-200 text-pink-800 hover:bg-pink-300",
  VRBO: "bg-blue-200 text-blue-800 hover:bg-blue-300",
  DIRECT: "bg-green-200 text-green-800 hover:bg-green-300",
  OTHER: "bg-gray-200 text-gray-800 hover:bg-gray-300",
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-blue-200 text-blue-800 hover:bg-blue-300",
  CHECKED_IN: "bg-green-200 text-green-800 hover:bg-green-300",
  CHECKED_OUT: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  CANCELLED: "bg-red-200 text-red-800 hover:bg-red-300",
};

function getCalendarDays(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const lastDay = new Date(year, m + 1, 0);

  const days: (Date | null)[] = [];

  // pad start
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, m, d));
  }

  // pad end
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function dateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d >= s && d < e;
}

export default function CalendarView({
  bookings,
  month,
  onMonthChange,
  onBookingClick,
}: CalendarViewProps) {
  const days = useMemo(() => getCalendarDays(month), [month]);

  const monthLabel = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    onMonthChange(d);
  }

  function nextMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    onMonthChange(d);
  }

  function goToday() {
    const now = new Date();
    onMonthChange(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  function getBookingsForDay(day: Date): CalendarBooking[] {
    return bookings.filter((b) => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      return dateInRange(day, checkIn, checkOut);
    });
  }

  function getBarColor(booking: CalendarBooking): string {
    if (booking.platform) {
      return PLATFORM_COLORS[booking.platform] ?? PLATFORM_COLORS.OTHER;
    }
    return STATUS_COLORS[booking.status] ?? STATUS_COLORS.CONFIRMED;
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {monthLabel}
          </h2>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToday}>
          Today
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              className="px-2 py-2 text-xs font-medium text-gray-500 text-center uppercase tracking-wider"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[80px] sm:min-h-[100px] bg-gray-50/50 border-b border-r border-gray-100"
                />
              );
            }

            const dayBookings = getBookingsForDay(day);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-100 p-1",
                  today && "bg-blue-50/50"
                )}
              >
                <div
                  className={cn(
                    "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    today
                      ? "bg-blue-600 text-white"
                      : "text-gray-700"
                  )}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => onBookingClick(booking.id)}
                      className={cn(
                        "w-full text-left px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium truncate transition-colors",
                        getBarColor(booking)
                      )}
                      title={`${booking.guest.name} - ${booking.unit.property.name} ${booking.unit.label}`}
                    >
                      <span className="hidden sm:inline">{booking.guest.name}</span>
                      <span className="sm:hidden">{booking.guest.name.split(" ")[0]}</span>
                    </button>
                  ))}
                  {dayBookings.length > 3 && (
                    <p className="text-[10px] text-gray-500 px-1">
                      +{dayBookings.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
