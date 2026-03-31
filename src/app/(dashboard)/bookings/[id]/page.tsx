"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Moon,
  DollarSign,
  User,
  Mail,
  Phone,
  Hash,
  FileText,
  Sparkles,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
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
  Input,
  Textarea,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlatformBadge, StatusBadge } from "@/components/bookings/BookingCard";

// ---------- Types ----------

interface BookingData {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  nightlyRate: number | string;
  totalAmount: number | string;
  status: "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  platform: string | null;
  confirmationNumber: string | null;
  notes: string | null;
  createdAt: string;
  guest: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    platform: string | null;
  };
  unit: {
    id: string;
    label: string;
    property: {
      id: string;
      name: string;
    };
  };
  cleaningTask: {
    id: string;
    status: string;
    scheduledDate: string;
    cost: number | string | null;
    notes: string | null;
    checklistItems: unknown;
    vendor: {
      id: string;
      name: string;
    } | null;
  } | null;
}

type TabKey = "details" | "cleaning" | "financials";

// ---------- Helpers ----------

function getNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

const BOOKING_STATUS_FLOW: Record<string, { next: string; label: string }> = {
  CONFIRMED: { next: "CHECKED_IN", label: "Check In Guest" },
  CHECKED_IN: { next: "CHECKED_OUT", label: "Check Out Guest" },
};

const CLEANING_STATUS_FLOW: Record<string, { next: string; label: string }> = {
  PENDING: { next: "IN_PROGRESS", label: "Start Cleaning" },
  IN_PROGRESS: { next: "COMPLETED", label: "Mark Completed" },
  COMPLETED: { next: "INSPECTED", label: "Mark Inspected" },
};

const CLEANING_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "warning" | "info" | "success" | "neutral" }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  IN_PROGRESS: { label: "In Progress", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
  INSPECTED: { label: "Inspected", variant: "success" },
};

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
        <div className="rounded-lg bg-[#e8f0e9] p-2.5">
          <Icon className="h-5 w-5 text-[#5c7c65]" />
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

// ---------- Tab Button ----------

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#5c7c65] text-[#5c7c65]"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

// ---------- Main Page ----------

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [cleaningUpdating, setCleaningUpdating] = useState(false);
  const [creatingCleaning, setCreatingCleaning] = useState(false);
  const [cleaningForm, setCleaningForm] = useState({
    scheduledDate: "",
    notes: "",
    cost: "",
  });

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch booking");
      const data = await res.json();
      setBooking(data);
    } catch {
      toast({ type: "error", title: "Failed to load booking" });
    } finally {
      setLoading(false);
    }
  }, [bookingId, toast]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // ---------- Update booking status ----------

  async function handleStatusUpdate(newStatus: string) {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ type: "success", title: `Booking ${newStatus.toLowerCase().replace("_", " ")}` });
      fetchBooking();
    } catch {
      toast({ type: "error", title: "Failed to update status" });
    } finally {
      setStatusUpdating(false);
    }
  }

  // ---------- Cancel booking ----------

  async function handleCancelBooking() {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error("Failed to cancel booking");
      toast({ type: "success", title: "Booking cancelled" });
      fetchBooking();
    } catch {
      toast({ type: "error", title: "Failed to cancel booking" });
    } finally {
      setStatusUpdating(false);
    }
  }

  // ---------- Update cleaning status ----------

  async function handleCleaningStatusUpdate(taskId: string, newStatus: string) {
    setCleaningUpdating(true);
    try {
      const res = await fetch(`/api/cleaning-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update cleaning status");
      toast({ type: "success", title: "Cleaning status updated" });
      fetchBooking();
    } catch {
      toast({ type: "error", title: "Failed to update cleaning status" });
    } finally {
      setCleaningUpdating(false);
    }
  }

  // ---------- Create cleaning task ----------

  async function handleCreateCleaning() {
    if (!booking || !cleaningForm.scheduledDate) {
      toast({ type: "error", title: "Scheduled date is required" });
      return;
    }
    setCreatingCleaning(true);
    try {
      const payload: Record<string, unknown> = {
        bookingId: booking.id,
        unitId: booking.unit.id,
        scheduledDate: cleaningForm.scheduledDate,
      };
      if (cleaningForm.notes) payload.notes = cleaningForm.notes;
      if (cleaningForm.cost) payload.cost = parseFloat(cleaningForm.cost);

      const res = await fetch("/api/cleaning-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create cleaning task");
      toast({ type: "success", title: "Cleaning task created" });
      setCleaningForm({ scheduledDate: "", notes: "", cost: "" });
      fetchBooking();
    } catch {
      toast({ type: "error", title: "Failed to create cleaning task" });
    } finally {
      setCreatingCleaning(false);
    }
  }

  // ---------- Loading ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" count={2} />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" count={1} />
          ))}
        </div>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  // ---------- Not found ----------

  if (notFound || !booking) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon={Calendar}
          title="Booking not found"
          description="The booking you're looking for doesn't exist or has been removed."
          action={
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              href="/bookings"
            >
              Back to Bookings
            </Button>
          }
        />
      </div>
    );
  }

  // ---------- Computed ----------

  const nights = getNights(booking.checkInDate, booking.checkOutDate);
  const statusFlow = BOOKING_STATUS_FLOW[booking.status];
  const cleaningCost = booking.cleaningTask?.cost ? Number(booking.cleaningTask.cost) : 0;
  const bookingRevenue = Number(booking.totalAmount);
  const platformFees = bookingRevenue * 0.03; // placeholder 3%
  const netRevenue = bookingRevenue - cleaningCost - platformFees;

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          href="/bookings"
          className="mb-4"
        >
          Bookings
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {booking.guest.name}
              </h1>
              <PlatformBadge platform={booking.platform} />
              <StatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {booking.unit.property.name} &mdash; {booking.unit.label}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {statusFlow && booking.status !== "CANCELLED" && (
              <Button
                size="sm"
                leftIcon={<CheckCircle className="h-4 w-4" />}
                onClick={() => handleStatusUpdate(statusFlow.next)}
                loading={statusUpdating}
              >
                {statusFlow.label}
              </Button>
            )}
            {booking.status !== "CANCELLED" && booking.status !== "CHECKED_OUT" && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<XCircle className="h-4 w-4" />}
                onClick={handleCancelBooking}
                loading={statusUpdating}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Check-in"
          value={formatDate(booking.checkInDate)}
          icon={Calendar}
        />
        <StatCard
          label="Check-out"
          value={formatDate(booking.checkOutDate)}
          icon={Calendar}
        />
        <StatCard
          label="Nights"
          value={nights}
          icon={Moon}
        />
        <StatCard
          label="Nightly Rate"
          value={formatCurrency(Number(booking.nightlyRate))}
          icon={DollarSign}
        />
        <StatCard
          label="Total Amount"
          value={formatCurrency(Number(booking.totalAmount))}
          icon={DollarSign}
        />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <TabButton
            label="Details"
            active={activeTab === "details"}
            onClick={() => setActiveTab("details")}
          />
          <TabButton
            label="Cleaning"
            active={activeTab === "cleaning"}
            onClick={() => setActiveTab("cleaning")}
          />
          <TabButton
            label="Financials"
            active={activeTab === "financials"}
            onClick={() => setActiveTab("financials")}
          />
        </div>

        <div className="mt-6">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Guest Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Guest Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Name
                      </p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-gray-400" />
                        {booking.guest.name}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Email
                      </p>
                      {booking.guest.email ? (
                        <a
                          href={`mailto:${booking.guest.email}`}
                          className="text-sm font-medium text-[#5c7c65] hover:text-[#3d5e44] flex items-center gap-1.5"
                        >
                          <Mail className="h-4 w-4" />
                          {booking.guest.email}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400">Not provided</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Phone
                      </p>
                      {booking.guest.phone ? (
                        <a
                          href={`tel:${booking.guest.phone}`}
                          className="text-sm font-medium text-[#5c7c65] hover:text-[#3d5e44] flex items-center gap-1.5"
                        >
                          <Phone className="h-4 w-4" />
                          {booking.guest.phone}
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
                        {booking.guest.platform ? (
                          <PlatformBadge platform={booking.guest.platform} />
                        ) : (
                          <p className="text-sm text-gray-400">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Confirmation Number
                      </p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <Hash className="h-4 w-4 text-gray-400" />
                        {booking.confirmationNumber || "N/A"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Notes
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* Status workflow */}
                  {booking.status !== "CANCELLED" && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Status Workflow
                      </p>
                      <div className="flex items-center gap-2">
                        {(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] as const).map((s, i) => {
                          const isComplete =
                            s === "CONFIRMED"
                              ? true
                              : s === "CHECKED_IN"
                              ? booking.status === "CHECKED_IN" || booking.status === "CHECKED_OUT"
                              : booking.status === "CHECKED_OUT";
                          const isCurrent = booking.status === s;
                          return (
                            <div key={s} className="flex items-center gap-2">
                              {i > 0 && (
                                <div
                                  className={`h-0.5 w-6 ${
                                    isComplete ? "bg-[#5c7c65]" : "bg-gray-200"
                                  }`}
                                />
                              )}
                              <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                  isCurrent
                                    ? "bg-[#e5eef5] text-[#4a6f8a] ring-2 ring-[#7b9eb8]/50"
                                    : isComplete
                                    ? "bg-[#e8f0e9] text-[#3d5e44]"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {isComplete && !isCurrent ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5" />
                                )}
                                {s === "CONFIRMED"
                                  ? "Confirmed"
                                  : s === "CHECKED_IN"
                                  ? "Checked In"
                                  : "Checked Out"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cleaning Tab */}
          {activeTab === "cleaning" && (
            <div className="space-y-6">
              {booking.cleaningTask ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Cleaning Task</CardTitle>
                      {(() => {
                        const config =
                          CLEANING_STATUS_CONFIG[booking.cleaningTask!.status] ?? {
                            label: booking.cleaningTask!.status,
                            variant: "neutral" as const,
                          };
                        return (
                          <Badge variant={config.variant} size="sm" dot>
                            {config.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Scheduled Date
                        </p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(booking.cleaningTask.scheduledDate)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Assigned Cleaner
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.cleaningTask.vendor?.name ?? "Unassigned"}
                        </p>
                      </div>

                      {booking.cleaningTask.cost != null && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Cost
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(Number(booking.cleaningTask.cost))}
                          </p>
                        </div>
                      )}
                    </div>

                    {booking.cleaningTask.notes && (
                      <div className="mt-4 space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Notes
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {booking.cleaningTask.notes}
                        </p>
                      </div>
                    )}

                    {/* Status advance buttons */}
                    {(() => {
                      const flow = CLEANING_STATUS_FLOW[booking.cleaningTask!.status];
                      if (!flow) return null;
                      return (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <Button
                            size="sm"
                            leftIcon={<Sparkles className="h-4 w-4" />}
                            onClick={() =>
                              handleCleaningStatusUpdate(
                                booking.cleaningTask!.id,
                                flow.next
                              )
                            }
                            loading={cleaningUpdating}
                          >
                            {flow.label}
                          </Button>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Create Cleaning Task</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                      No cleaning task has been created for this booking yet.
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label="Scheduled Date"
                        type="date"
                        value={cleaningForm.scheduledDate}
                        onChange={(e) =>
                          setCleaningForm((f) => ({ ...f, scheduledDate: e.target.value }))
                        }
                      />
                      <Input
                        label="Cost ($)"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={cleaningForm.cost}
                        onChange={(e) =>
                          setCleaningForm((f) => ({ ...f, cost: e.target.value }))
                        }
                      />
                    </div>
                    <Textarea
                      placeholder="Notes about the cleaning task..."
                      rows={3}
                      value={cleaningForm.notes}
                      onChange={(e) =>
                        setCleaningForm((f) => ({ ...f, notes: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={handleCreateCleaning}
                      loading={creatingCleaning}
                      loadingText="Creating..."
                    >
                      Create Cleaning Task
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === "financials" && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#5c7c65]" />
                      <span className="text-sm font-medium text-gray-700">
                        Booking Revenue
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#5c7c65]">
                      +{formatCurrency(bookingRevenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#c75a3a]" />
                      <span className="text-sm font-medium text-gray-700">
                        Cleaning Cost
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#c75a3a]">
                      -{formatCurrency(cleaningCost)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#c75a3a]" />
                      <span className="text-sm font-medium text-gray-700">
                        Platform Fees (est. 3%)
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#c75a3a]">
                      -{formatCurrency(platformFees)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 bg-gray-50 -mx-6 px-6 rounded-lg">
                    <span className="text-sm font-bold text-gray-900">
                      Net Revenue
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        netRevenue >= 0 ? "text-[#5c7c65]" : "text-[#c75a3a]"
                      }`}
                    >
                      {formatCurrency(netRevenue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
