"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar,
  List,
  Search,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  LoadingSkeleton,
  Select,
} from "@/components/ui";
import BookingCard, { type BookingCardData } from "@/components/bookings/BookingCard";
import CalendarView from "@/components/bookings/CalendarView";

type ViewMode = "list" | "calendar";

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "CHECKED_OUT", label: "Checked Out" },
  { value: "CANCELLED", label: "Cancelled" },
];

function BookingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded w-2/5" />
            <div className="h-3 bg-gray-200 rounded w-3/5" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 rounded-full w-14" />
            <div className="h-5 bg-gray-200 rounded-full w-20" />
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </Card>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Fetch properties for filter
  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/properties?type=SHORT_TERM");
        if (res.ok) {
          const data = await res.json();
          setProperties(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        }
      } catch {
        // non-critical
      }
    }
    fetchProperties();
  }, []);

  // Fetch bookings
  useEffect(() => {
    async function fetchBookings() {
      try {
        let url: string;
        if (viewMode === "calendar") {
          const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
          const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
          url = `/api/bookings/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
        } else {
          const params = new URLSearchParams();
          if (statusFilter !== "ALL") params.set("status", statusFilter);
          if (propertyFilter !== "ALL") params.set("propertyId", propertyFilter);
          url = `/api/bookings${params.toString() ? `?${params}` : ""}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load bookings");
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    setError(null);
    fetchBookings();
  }, [statusFilter, propertyFilter, viewMode, calendarMonth]);

  const filteredBookings = bookings;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage short-term rental bookings and reservations.
          </p>
        </div>
        <Button
          href="/bookings/new"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Booking
        </Button>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* View mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-[#e8f0e9] text-[#3d5e44]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-l border-gray-200 transition-colors ${
              viewMode === "calendar"
                ? "bg-[#e8f0e9] text-[#3d5e44]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </button>
        </div>

        {/* Filters (list view only) */}
        {viewMode === "list" && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status filter pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {STATUS_FILTERS.map((sf) => (
                <button
                  key={sf.value}
                  type="button"
                  onClick={() => setStatusFilter(sf.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === sf.value
                      ? "bg-[#e8f0e9] text-[#3d5e44]"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>

            {/* Property filter */}
            {properties.length > 0 && (
              <Select
                options={[
                  { value: "ALL", label: "All Properties" },
                  ...properties.map((p) => ({ value: p.id, label: p.name })),
                ]}
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-44"
              />
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && viewMode === "list" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {loading && viewMode === "calendar" && (
        <LoadingSkeleton variant="card" count={1} />
      )}

      {/* Error state */}
      {!loading && error && (
        <Card padding="lg">
          <div className="text-center">
            <p className="text-sm text-[#c75a3a]">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetch("/api/bookings")
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed to load bookings");
                    return res.json();
                  })
                  .then(setBookings)
                  .catch((err) =>
                    setError(err instanceof Error ? err.message : "Something went wrong")
                  )
                  .finally(() => setLoading(false));
              }}
            >
              Try again
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredBookings.length === 0 && viewMode === "list" && (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description="Add your first booking to start tracking your short-term rental reservations."
            action={
              <Button
                href="/bookings/new"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Booking
              </Button>
            }
          />
        </Card>
      )}

      {/* List view */}
      {!loading && !error && viewMode === "list" && filteredBookings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => router.push(`/bookings/${booking.id}`)}
            />
          ))}
        </div>
      )}

      {/* Calendar view */}
      {!loading && !error && viewMode === "calendar" && (
        <CalendarView
          bookings={filteredBookings}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          onBookingClick={(id) => router.push(`/bookings/${id}`)}
        />
      )}
    </div>
  );
}
