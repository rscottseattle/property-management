"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Phone,
  Star,
  Calendar,
  Moon,
  DollarSign,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoadingSkeleton,
  EmptyState,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlatformBadge, StatusBadge } from "@/components/bookings/BookingCard";

// ---------- Types ----------

interface GuestBooking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number | string;
  nightlyRate: number | string;
  status: string;
  platform: string | null;
  unit: {
    label: string;
    property: {
      name: string;
    };
  };
}

interface GuestData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  platform: string | null;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  bookings: GuestBooking[];
}

// ---------- Helpers ----------

function getNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-sm text-gray-400">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "text-[#c9a96e] fill-[#c9a96e]" : "text-gray-200"
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
    </div>
  );
}

// ---------- Stat Card ----------

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#e5eef5] p-2.5">
          <Icon className="h-5 w-5 text-[#7b9eb8]" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ---------- Main Page ----------

export default function GuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const guestId = params.id as string;

  const [guest, setGuest] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchGuest = useCallback(async () => {
    try {
      const res = await fetch(`/api/guests/${guestId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch guest");
      const data = await res.json();
      setGuest(data);
    } catch {
      toast({ type: "error", title: "Failed to load guest" });
    } finally {
      setLoading(false);
    }
  }, [guestId, toast]);

  useEffect(() => {
    fetchGuest();
  }, [fetchGuest]);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/guests/${guestId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete guest");
      toast({ type: "success", title: "Guest deleted" });
      router.push("/guests");
    } catch {
      toast({ type: "error", title: "Failed to delete guest" });
    } finally {
      setDeleteLoading(false);
    }
  }

  // ---------- Loading ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" count={2} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" count={1} />
          ))}
        </div>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  // ---------- Not found ----------

  if (notFound || !guest) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon={UserCircle}
          title="Guest not found"
          description="The guest you're looking for doesn't exist or has been removed."
          action={
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              href="/guests"
            >
              Back to Guests
            </Button>
          }
        />
      </div>
    );
  }

  // ---------- Computed ----------

  const totalBookings = guest.bookings.length;
  const totalRevenue = guest.bookings.reduce(
    (sum, b) => sum + Number(b.totalAmount),
    0
  );
  const totalNights = guest.bookings.reduce(
    (sum, b) => sum + getNights(b.checkInDate, b.checkOutDate),
    0
  );
  const avgStayLength = totalBookings > 0 ? (totalNights / totalBookings).toFixed(1) : "0";

  const sortedBookings = [...guest.bookings].sort(
    (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
  );

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          href="/guests"
          className="mb-4"
        >
          Guests
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{guest.name}</h1>
              <PlatformBadge platform={guest.platform} />
            </div>
            <div className="mt-1">
              <StarRating rating={guest.rating} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Pencil className="h-4 w-4" />}
              href="#"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={handleDelete}
              loading={deleteLoading}
              loadingText="Deleting..."
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </p>
              {guest.email ? (
                <a
                  href={`mailto:${guest.email}`}
                  className="text-sm font-medium text-[#5c7c65] hover:text-[#3d5e44] flex items-center gap-1.5"
                >
                  <Mail className="h-4 w-4" />
                  {guest.email}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Phone
              </p>
              {guest.phone ? (
                <a
                  href={`tel:${guest.phone}`}
                  className="text-sm font-medium text-[#5c7c65] hover:text-[#3d5e44] flex items-center gap-1.5"
                >
                  <Phone className="h-4 w-4" />
                  {guest.phone}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Platform
              </p>
              <div>
                {guest.platform ? (
                  <PlatformBadge platform={guest.platform} />
                ) : (
                  <p className="text-sm text-gray-400">Not specified</p>
                )}
              </div>
            </div>
          </div>

          {guest.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Notes
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {guest.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={totalBookings}
          icon={Calendar}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
        />
        <StatCard
          label="Total Nights"
          value={totalNights}
          icon={Moon}
        />
        <StatCard
          label="Avg. Stay Length"
          value={`${avgStayLength} nights`}
          icon={Moon}
        />
      </div>

      {/* Booking History */}
      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No bookings yet"
              description="This guest has no booking history."
            />
          ) : (
            <div className="space-y-3">
              {sortedBookings.map((booking) => {
                const nights = getNights(booking.checkInDate, booking.checkOutDate);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          {booking.unit.property.name} &mdash; {booking.unit.label}
                        </span>
                        <span className="text-gray-500 ml-2">
                          {formatDate(booking.checkInDate)} &rarr;{" "}
                          {formatDate(booking.checkOutDate)}
                        </span>
                        <span className="text-gray-400 ml-1">
                          ({nights} night{nights !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(Number(booking.totalAmount))}
                      </span>
                      <StatusBadge status={booking.status} />
                      <PlatformBadge platform={booking.platform} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
