"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { BOOKING_PLATFORMS } from "@/lib/constants";

const bookingSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().min(1, "Unit is required"),
  guestId: z.string().optional(),
  newGuestName: z.string().optional(),
  newGuestEmail: z.string().optional(),
  newGuestPhone: z.string().optional(),
  newGuestPlatform: z.string().optional(),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  nightlyRate: z.string().min(1, "Nightly rate is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  platform: z.string().optional(),
  confirmationNumber: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface PropertyOption {
  id: string;
  name: string;
  type: string;
  units: {
    id: string;
    label: string;
    status: string;
  }[];
}

interface GuestOption {
  id: string;
  name: string;
  email: string | null;
  platform: string | null;
}

export default function NewBookingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [guests, setGuests] = useState<GuestOption[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [isNewGuest, setIsNewGuest] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      propertyId: "",
      unitId: "",
      guestId: "",
      newGuestName: "",
      newGuestEmail: "",
      newGuestPhone: "",
      newGuestPlatform: "",
      checkInDate: "",
      checkOutDate: "",
      nightlyRate: "",
      totalAmount: "",
      platform: "",
      confirmationNumber: "",
      notes: "",
    },
  });

  const selectedPropertyId = watch("propertyId");
  const checkInDate = watch("checkInDate");
  const checkOutDate = watch("checkOutDate");
  const nightlyRate = watch("nightlyRate");
  const guestId = watch("guestId");

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const availableUnits = selectedProperty?.units ?? [];

  // Auto-calculate total
  useEffect(() => {
    if (checkInDate && checkOutDate && nightlyRate) {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
      const total = (nights * parseFloat(nightlyRate)).toFixed(2);
      setValue("totalAmount", total);
    }
  }, [checkInDate, checkOutDate, nightlyRate, setValue]);

  // Handle guest selection
  useEffect(() => {
    if (guestId === "__new__") {
      setIsNewGuest(true);
    } else {
      setIsNewGuest(false);
    }
  }, [guestId]);

  // Fetch properties
  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/properties");
        if (!res.ok) throw new Error("Failed to load properties");
        const data = await res.json();
        setProperties(data.filter((p: PropertyOption) => p.type === "SHORT_TERM"));
      } catch {
        // optional
      } finally {
        setPropertiesLoading(false);
      }
    }
    fetchProperties();
  }, []);

  // Fetch guests
  useEffect(() => {
    async function fetchGuests() {
      try {
        const res = await fetch("/api/guests");
        if (!res.ok) throw new Error("Failed to load guests");
        const data = await res.json();
        setGuests(data);
      } catch {
        // optional
      } finally {
        setGuestsLoading(false);
      }
    }
    fetchGuests();
  }, []);

  async function onSubmit(data: BookingFormData) {
    try {
      let finalGuestId = data.guestId;

      // Create new guest if needed
      if (isNewGuest && data.newGuestName) {
        const guestPayload: Record<string, unknown> = {
          name: data.newGuestName,
        };
        if (data.newGuestEmail) guestPayload.email = data.newGuestEmail;
        if (data.newGuestPhone) guestPayload.phone = data.newGuestPhone;
        if (data.newGuestPlatform) guestPayload.platform = data.newGuestPlatform;

        const guestRes = await fetch("/api/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(guestPayload),
        });

        if (!guestRes.ok) {
          const body = await guestRes.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to create guest");
        }

        const newGuest = await guestRes.json();
        finalGuestId = newGuest.id;
      }

      const payload: Record<string, unknown> = {
        unitId: data.unitId,
        guestId: finalGuestId,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        nightlyRate: parseFloat(data.nightlyRate),
        totalAmount: parseFloat(data.totalAmount),
      };
      if (data.platform) payload.platform = data.platform;
      if (data.confirmationNumber) payload.confirmationNumber = data.confirmationNumber;
      if (data.notes) payload.notes = data.notes;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create booking");
      }

      const created = await res.json();
      toast({
        type: "success",
        title: "Booking created",
        description: "The booking has been added successfully.",
      });
      router.push(`/bookings/${created.id}`);
    } catch (err) {
      toast({
        type: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  // Calculate nights for display
  const nights =
    checkInDate && checkOutDate
      ? Math.max(
          1,
          Math.round(
            (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/bookings"
          className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Back to bookings"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add Booking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new short-term rental reservation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Property & Unit */}
        <Card>
          <CardHeader>
            <CardTitle>Property &amp; Unit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Property"
                options={[
                  { value: "", label: propertiesLoading ? "Loading..." : "Select a property" },
                  ...properties.map((p) => ({ value: p.id, label: p.name })),
                ]}
                error={errors.propertyId?.message}
                {...register("propertyId")}
              />
              <Select
                label="Unit"
                options={[
                  {
                    value: "",
                    label: selectedPropertyId
                      ? availableUnits.length > 0
                        ? "Select a unit"
                        : "No units available"
                      : "Select a property first",
                  },
                  ...availableUnits.map((u) => ({ value: u.id, label: u.label })),
                ]}
                disabled={!selectedPropertyId || availableUnits.length === 0}
                error={errors.unitId?.message}
                {...register("unitId")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Guest */}
        <Card>
          <CardHeader>
            <CardTitle>Guest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Guest"
              options={[
                { value: "", label: guestsLoading ? "Loading..." : "Select a guest" },
                { value: "__new__", label: "+ Add New Guest" },
                ...guests.map((g) => ({
                  value: g.id,
                  label: `${g.name}${g.platform ? ` (${g.platform})` : ""}`,
                })),
              ]}
              error={!isNewGuest ? errors.guestId?.message : undefined}
              {...register("guestId")}
            />

            {isNewGuest && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">New Guest Details</p>
                <Input
                  label="Full Name"
                  placeholder="e.g., John Smith"
                  {...register("newGuestName")}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("newGuestEmail")}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...register("newGuestPhone")}
                  />
                </div>
                <Select
                  label="Platform"
                  options={[
                    { value: "", label: "Select platform" },
                    ...BOOKING_PLATFORMS.map((p) => ({ value: p.value.toUpperCase(), label: p.label })),
                  ]}
                  {...register("newGuestPlatform")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Dates & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Dates &amp; Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Check-in Date"
                type="date"
                error={errors.checkInDate?.message}
                {...register("checkInDate")}
              />
              <Input
                label="Check-out Date"
                type="date"
                error={errors.checkOutDate?.message}
                {...register("checkOutDate")}
              />
            </div>

            {nights > 0 && (
              <p className="text-sm text-gray-500">
                {nights} night{nights !== 1 ? "s" : ""}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nightly Rate ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.nightlyRate?.message}
                {...register("nightlyRate")}
              />
              <Input
                label="Total Amount ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.totalAmount?.message}
                {...register("totalAmount")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Platform"
                options={[
                  { value: "", label: "Select platform" },
                  ...BOOKING_PLATFORMS.map((p) => ({ value: p.value.toUpperCase(), label: p.label })),
                ]}
                {...register("platform")}
              />
              <Input
                label="Confirmation Number"
                placeholder="Optional"
                {...register("confirmationNumber")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special instructions or notes about this booking..."
              rows={4}
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Form footer */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button variant="outline" href="/bookings">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Saving..."
          >
            Create Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
