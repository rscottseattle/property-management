"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
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
import { StarRating } from "@/components/vendors/StarRating";

const TRADE_OPTIONS = [
  { value: "", label: "Select a trade" },
  { value: "Plumber", label: "Plumber" },
  { value: "Electrician", label: "Electrician" },
  { value: "HVAC", label: "HVAC" },
  { value: "General Contractor", label: "General Contractor" },
  { value: "Painter", label: "Painter" },
  { value: "Landscaper", label: "Landscaper" },
  { value: "Cleaner", label: "Cleaner" },
  { value: "Roofer", label: "Roofer" },
  { value: "Appliance Repair", label: "Appliance Repair" },
  { value: "Locksmith", label: "Locksmith" },
  { value: "Pest Control", label: "Pest Control" },
  { value: "Other", label: "Other" },
];

const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  trade: z.string().min(1, "Trade/specialty is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
  rating: z.number().min(1).max(5).optional().nullable(),
  notes: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function NewVendorPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vendorSchema) as any,
    defaultValues: {
      name: "",
      trade: "",
      phone: "",
      email: "",
      website: "",
      rating: null,
      notes: "",
    },
  });

  async function onSubmit(data: VendorFormData) {
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        trade: data.trade,
      };
      if (data.phone) payload.phone = data.phone;
      if (data.email) payload.email = data.email;
      if (data.website) payload.website = data.website;
      if (data.rating) payload.rating = data.rating;
      if (data.notes) payload.notes = data.notes;

      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create vendor");
      }

      const created = await res.json();
      toast({
        type: "success",
        title: "Vendor added",
        description: `${data.name} has been added successfully.`,
      });
      router.push(`/vendors/${created.id}`);
    } catch (err) {
      toast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendors"
          className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Back to vendors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add Vendor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter details about your new service provider.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Vendor Name"
              placeholder="e.g., ABC Plumbing"
              error={errors.name?.message}
              {...register("name")}
            />
            <Select
              label="Trade / Specialty"
              options={TRADE_OPTIONS}
              error={errors.trade?.message}
              {...register("trade")}
            />
          </CardContent>
        </Card>

        {/* Section 2: Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                type="tel"
                placeholder="(555) 123-4567"
                error={errors.phone?.message}
                {...register("phone")}
              />
              <Input
                label="Email"
                type="email"
                placeholder="vendor@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
            <Input
              label="Website"
              type="url"
              placeholder="https://example.com"
              error={errors.website?.message}
              {...register("website")}
            />
          </CardContent>
        </Card>

        {/* Section 3: Rating & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Rating &amp; Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rating
              </label>
              <Controller
                control={control}
                name="rating"
                render={({ field }) => (
                  <StarRating
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    size="lg"
                  />
                )}
              />
            </div>
            <Textarea
              label="Notes"
              placeholder="Any additional notes about this vendor..."
              rows={4}
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Form footer */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button variant="outline" href="/vendors">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Saving..."
          >
            Save Vendor
          </Button>
        </div>
      </form>
    </div>
  );
}
