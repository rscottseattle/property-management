"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, X } from "lucide-react";
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

const requestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  vendorId: z.string().optional(),
  estimatedCompletionDate: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface PropertyOption {
  id: string;
  name: string;
  units: { id: string; label: string }[];
}

interface TenantOption {
  id: string;
  name: string;
  unit?: { id: string; propertyId: string } | null;
}

interface VendorOption {
  id: string;
  name: string;
  trade: string;
}

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(requestSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      propertyId: "",
      unitId: "",
      tenantId: "",
      vendorId: "",
      estimatedCompletionDate: "",
      photos: [],
    },
  });

  const selectedPropertyId = watch("propertyId");

  // Fetch properties, tenants, vendors
  useEffect(() => {
    async function fetchOptions() {
      const [propRes, tenantRes, vendorRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/tenants"),
        fetch("/api/vendors"),
      ]);
      if (propRes.ok) {
        const data = await propRes.json();
        setProperties(data);
      }
      if (tenantRes.ok) {
        const data = await tenantRes.json();
        setTenants(data);
      }
      if (vendorRes.ok) {
        const data = await vendorRes.json();
        setVendors(data);
      }
    }
    fetchOptions();
  }, []);

  // Reset unit/tenant when property changes
  useEffect(() => {
    setValue("unitId", "");
    setValue("tenantId", "");
  }, [selectedPropertyId, setValue]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const unitOptions = selectedProperty?.units ?? [];
  const filteredTenants = tenants.filter(
    (t) => t.unit && (t.unit as { id: string; propertyId?: string }).propertyId === selectedPropertyId
  );

  function addPhotoUrl() {
    setPhotoUrls((prev) => [...prev, ""]);
  }

  function removePhotoUrl(index: number) {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePhotoUrl(index: number, value: string) {
    setPhotoUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  }

  async function onSubmit(data: RequestFormData) {
    try {
      const payload = {
        ...data,
        unitId: data.unitId || undefined,
        tenantId: data.tenantId || undefined,
        vendorId: data.vendorId || undefined,
        estimatedCompletionDate: data.estimatedCompletionDate || undefined,
        photos: photoUrls.filter((url) => url.trim() !== ""),
      };

      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create request");
      }

      const created = await res.json();
      toast({
        type: "success",
        title: "Request created",
        description: `"${data.title}" has been submitted.`,
      });
      router.push(`/maintenance/${created.id}`);
    } catch (err) {
      toast({
        type: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/maintenance"
          className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Back to maintenance"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            New Maintenance Request
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit a new maintenance work order.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Request Details */}
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g., Leaking kitchen faucet"
              error={errors.title?.message}
              {...register("title")}
            />
            <Textarea
              label="Description"
              placeholder="Describe the issue in detail..."
              rows={4}
              error={errors.description?.message}
              {...register("description")}
            />
            <Select
              label="Priority"
              options={[
                { value: "LOW", label: "Low" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HIGH", label: "High" },
                { value: "EMERGENCY", label: "Emergency" },
              ]}
              error={errors.priority?.message}
              {...register("priority")}
            />
          </CardContent>
        </Card>

        {/* Section 2: Property & Unit */}
        <Card>
          <CardHeader>
            <CardTitle>Property &amp; Unit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Property"
              options={[
                { value: "", label: "Select a property..." },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
              error={errors.propertyId?.message}
              {...register("propertyId")}
            />
            {unitOptions.length > 0 && (
              <Select
                label="Unit"
                options={[
                  { value: "", label: "Select a unit (optional)" },
                  ...unitOptions.map((u) => ({ value: u.id, label: u.label })),
                ]}
                error={errors.unitId?.message}
                {...register("unitId")}
              />
            )}
            {filteredTenants.length > 0 && (
              <Select
                label="Tenant"
                options={[
                  { value: "", label: "Select a tenant (optional)" },
                  ...filteredTenants.map((t) => ({ value: t.id, label: t.name })),
                ]}
                error={errors.tenantId?.message}
                {...register("tenantId")}
              />
            )}
          </CardContent>
        </Card>

        {/* Section 3: Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Vendor"
              options={[
                { value: "", label: "Select a vendor (optional)" },
                ...vendors.map((v) => ({ value: v.id, label: `${v.name} — ${v.trade}` })),
              ]}
              error={errors.vendorId?.message}
              {...register("vendorId")}
            />
            <Input
              label="Estimated Completion Date"
              type="date"
              error={errors.estimatedCompletionDate?.message}
              {...register("estimatedCompletionDate")}
            />
          </CardContent>
        </Card>

        {/* Section 4: Photos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Photos</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={addPhotoUrl}
              >
                Add Photo URL
              </Button>
            </div>
          </CardHeader>
          {photoUrls.length > 0 && (
            <CardContent className="space-y-3">
              {photoUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="https://example.com/photo.jpg"
                      value={url}
                      onChange={(e) => updatePhotoUrl(index, e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhotoUrl(index)}
                    className="rounded-md p-1.5 text-gray-400 hover:text-[#c75a3a] hover:bg-[#fae8e3] transition-colors"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Form footer */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button variant="outline" href="/maintenance">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Saving..."
          >
            Save Request
          </Button>
        </div>
      </form>
    </div>
  );
}
