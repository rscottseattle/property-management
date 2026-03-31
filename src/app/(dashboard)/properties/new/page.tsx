"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
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
import { PROPERTY_TYPES } from "@/lib/constants";

const unitSchema = z.object({
  label: z.string().min(1, "Unit label is required"),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  squareFootage: z.coerce.number().int().min(0).optional(),
});

const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  type: z.enum(["LONG_TERM", "SHORT_TERM"]),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
  address: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  purchasePrice: z.coerce.number().min(0).optional(),
  purchaseDate: z.string().optional(),
  mortgageAmount: z.coerce.number().min(0).optional(),
  insuranceCost: z.coerce.number().min(0).optional(),
  propertyTax: z.coerce.number().min(0).optional(),
  units: z.array(unitSchema).min(1, "At least one unit is required"),
  notes: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function NewPropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [financialsOpen, setFinancialsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertySchema) as any,
    defaultValues: {
      name: "",
      type: "LONG_TERM",
      status: "ACTIVE",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      units: [{ label: "Default", bedrooms: undefined, bathrooms: undefined, squareFootage: undefined }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "units",
  });

  async function onSubmit(data: PropertyFormData) {
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create property");
      }

      const created = await res.json();
      toast({
        type: "success",
        title: "Property created",
        description: `${data.name} has been added to your portfolio.`,
      });
      router.push(`/properties/${created.id}`);
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
          href="/properties"
          className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Back to properties"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Add Property
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter details about your new rental property.
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
              label="Property Name"
              placeholder="e.g., Maple Street Duplex"
              error={errors.name?.message}
              {...register("name")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Property Type"
                options={PROPERTY_TYPES.map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
                error={errors.type?.message}
                {...register("type")}
              />
              <Select
                label="Status"
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "ARCHIVED", label: "Archived" },
                ]}
                error={errors.status?.message}
                {...register("status")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Street Address"
              placeholder="123 Main St"
              error={errors.address?.message}
              {...register("address")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="City"
                placeholder="Springfield"
                error={errors.city?.message}
                {...register("city")}
              />
              <Input
                label="State"
                placeholder="IL"
                error={errors.state?.message}
                {...register("state")}
              />
              <Input
                label="ZIP Code"
                placeholder="62701"
                error={errors.zipCode?.message}
                {...register("zipCode")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Financial Details (collapsible) */}
        <Card>
          <button
            type="button"
            onClick={() => setFinancialsOpen(!financialsOpen)}
            className="flex items-center justify-between w-full px-6 pt-6 pb-2 text-left"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 leading-none">
                Financial Details
              </h3>
              <p className="mt-1.5 text-sm text-gray-500">Optional</p>
            </div>
            {financialsOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {financialsOpen && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Purchase Price"
                  type="number"
                  placeholder="0.00"
                  leftAddon="$"
                  {...register("purchasePrice")}
                />
                <Input
                  label="Purchase Date"
                  type="date"
                  {...register("purchaseDate")}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="Mortgage Amount"
                  type="number"
                  placeholder="0.00"
                  leftAddon="$"
                  {...register("mortgageAmount")}
                />
                <Input
                  label="Insurance Cost"
                  type="number"
                  placeholder="0.00"
                  leftAddon="$"
                  {...register("insuranceCost")}
                />
                <Input
                  label="Annual Property Tax"
                  type="number"
                  placeholder="0.00"
                  leftAddon="$"
                  {...register("propertyTax")}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 4: Units */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Units</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() =>
                  append({
                    label: "",
                    bedrooms: undefined,
                    bathrooms: undefined,
                    squareFootage: undefined,
                  })
                }
              >
                Add Unit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.units?.root?.message && (
              <p className="text-sm text-[#c75a3a]">
                {errors.units.root.message}
              </p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Unit {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-md p-1 text-gray-400 hover:text-[#c75a3a] hover:bg-[#fae8e3] transition-colors"
                      aria-label={`Remove unit ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <Input
                    label="Label"
                    placeholder="e.g., Unit A"
                    error={errors.units?.[index]?.label?.message}
                    {...register(`units.${index}.label`)}
                  />
                  <Input
                    label="Bedrooms"
                    type="number"
                    placeholder="0"
                    min={0}
                    error={errors.units?.[index]?.bedrooms?.message}
                    {...register(`units.${index}.bedrooms`)}
                  />
                  <Input
                    label="Bathrooms"
                    type="number"
                    placeholder="0"
                    min={0}
                    step={0.5}
                    error={errors.units?.[index]?.bathrooms?.message}
                    {...register(`units.${index}.bathrooms`)}
                  />
                  <Input
                    label="Sq Ft"
                    type="number"
                    placeholder="0"
                    min={0}
                    error={errors.units?.[index]?.squareFootage?.message}
                    {...register(`units.${index}.squareFootage`)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Section 5: Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional notes about this property..."
              rows={4}
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Form footer */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button variant="outline" href="/properties">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Saving..."
          >
            Save Property
          </Button>
        </div>
      </form>
    </div>
  );
}
