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

const tenantSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  moveInDate: z.string().optional(),
  notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface PropertyOption {
  id: string;
  name: string;
  units: {
    id: string;
    label: string;
    status: string;
  }[];
}

export default function NewTenantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tenantSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      emergencyContact: "",
      emergencyPhone: "",
      propertyId: "",
      unitId: "",
      moveInDate: "",
      notes: "",
    },
  });

  const selectedPropertyId = watch("propertyId");

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const vacantUnits =
    selectedProperty?.units.filter((u) => u.status === "VACANT") ?? [];

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/properties");
        if (!res.ok) throw new Error("Failed to load properties");
        const data = await res.json();
        setProperties(data);
      } catch {
        // Properties are optional for tenant creation
      } finally {
        setPropertiesLoading(false);
      }
    }
    fetchProperties();
  }, []);

  async function onSubmit(data: TenantFormData) {
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
      };
      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;
      if (data.emergencyContact)
        payload.emergencyContact = data.emergencyContact;
      if (data.emergencyPhone) payload.emergencyPhone = data.emergencyPhone;
      if (data.unitId) payload.unitId = data.unitId;
      if (data.moveInDate) payload.moveInDate = data.moveInDate;
      if (data.notes) payload.notes = data.notes;

      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create tenant");
      }

      const created = await res.json();
      toast({
        type: "success",
        title: "Tenant added",
        description: `${data.name} has been added successfully.`,
      });
      router.push(`/tenants/${created.id}`);
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
          href="/tenants"
          className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Back to tenants"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add Tenant</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter details about your new tenant.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g., John Smith"
              error={errors.name?.message}
              {...register("name")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="(555) 123-4567"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Contact Name"
                placeholder="e.g., Jane Smith"
                {...register("emergencyContact")}
              />
              <Input
                label="Contact Phone"
                type="tel"
                placeholder="(555) 987-6543"
                {...register("emergencyPhone")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Unit Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Property"
                options={[
                  { value: "", label: propertiesLoading ? "Loading..." : "Select a property" },
                  ...properties.map((p) => ({
                    value: p.id,
                    label: p.name,
                  })),
                ]}
                {...register("propertyId")}
              />
              <Select
                label="Unit"
                options={[
                  {
                    value: "",
                    label: selectedPropertyId
                      ? vacantUnits.length > 0
                        ? "Select a unit"
                        : "No vacant units"
                      : "Select a property first",
                  },
                  ...vacantUnits.map((u) => ({
                    value: u.id,
                    label: u.label,
                  })),
                ]}
                disabled={!selectedPropertyId || vacantUnits.length === 0}
                {...register("unitId")}
              />
            </div>
            <Input
              label="Move-in Date"
              type="date"
              {...register("moveInDate")}
            />
          </CardContent>
        </Card>

        {/* Section 4: Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional notes about this tenant..."
              rows={4}
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Form footer */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button variant="outline" href="/tenants">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Saving..."
          >
            Save Tenant
          </Button>
        </div>
      </form>
    </div>
  );
}
