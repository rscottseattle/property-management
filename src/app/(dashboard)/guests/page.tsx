"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle,
  Plus,
  Mail,
  Phone,
  Calendar,
  Star,
  Search,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  LoadingSkeleton,
  Input,
} from "@/components/ui";
import { PlatformBadge } from "@/components/bookings/BookingCard";

interface GuestData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  platform: string | null;
  rating: number | null;
  _count?: {
    bookings: number;
  };
  bookings?: {
    checkOutDate: string;
  }[];
}

const PLATFORM_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "AIRBNB", label: "Airbnb" },
  { value: "VRBO", label: "VRBO" },
  { value: "DIRECT", label: "Direct" },
  { value: "OTHER", label: "Other" },
];

function GuestCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded w-2/5" />
            <div className="h-3 bg-gray-200 rounded w-3/5" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-4/5" />
          <div className="h-3 bg-gray-200 rounded w-3/5" />
        </div>
      </div>
    </Card>
  );
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? "text-[#c9a96e] fill-[#c9a96e]" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function GuestsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchGuests() {
      try {
        const params = new URLSearchParams();
        if (platformFilter !== "ALL") params.set("platform", platformFilter);
        if (searchQuery) params.set("search", searchQuery);
        const url = `/api/guests${params.toString() ? `?${params}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load guests");
        const data = await res.json();
        setGuests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    setError(null);
    fetchGuests();
  }, [platformFilter, searchQuery]);

  function getLastStay(guest: GuestData): string | null {
    if (!guest.bookings || guest.bookings.length === 0) return null;
    const sorted = [...guest.bookings].sort(
      (a, b) => new Date(b.checkOutDate).getTime() - new Date(a.checkOutDate).getTime()
    );
    return sorted[0].checkOutDate;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Guests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your short-term rental guests.
          </p>
        </div>
        <Button
          href="/guests/new"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Guest
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c7c65] focus:border-transparent"
          />
        </div>

        {/* Platform filter pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {PLATFORM_FILTERS.map((pf) => (
            <button
              key={pf.value}
              type="button"
              onClick={() => setPlatformFilter(pf.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                platformFilter === pf.value
                  ? "bg-[#e8f0e9] text-[#3d5e44]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {pf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <GuestCardSkeleton key={i} />
          ))}
        </div>
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
                fetch("/api/guests")
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed to load guests");
                    return res.json();
                  })
                  .then(setGuests)
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
      {!loading && !error && guests.length === 0 && (
        <Card>
          <EmptyState
            icon={UserCircle}
            title="No guests yet"
            description="Add your first guest to start tracking your short-term rental relationships."
            action={
              <Button
                href="/guests/new"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Guest
              </Button>
            }
          />
        </Card>
      )}

      {/* Guest grid */}
      {!loading && !error && guests.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guests.map((guest) => {
            const bookingCount = guest._count?.bookings ?? guest.bookings?.length ?? 0;
            const lastStay = getLastStay(guest);

            return (
              <Card
                key={guest.id}
                hover
                className="cursor-pointer"
                onClick={() => router.push(`/guests/${guest.id}`)}
              >
                <div className="p-5 space-y-3">
                  {/* Header: avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5eef5]">
                      <UserCircle className="h-5 w-5 text-[#7b9eb8]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {guest.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={guest.platform} />
                        <StarRating rating={guest.rating} />
                      </div>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1">
                    {guest.email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {guest.email}
                      </p>
                    )}
                    {guest.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                        <Phone className="h-3 w-3 shrink-0" />
                        {guest.phone}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>
                      {bookingCount} booking{bookingCount !== 1 ? "s" : ""}
                    </span>
                    {lastStay && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last stay: {new Date(lastStay).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
