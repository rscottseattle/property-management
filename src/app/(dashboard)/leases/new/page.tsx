"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";

// ---------- Schema ----------

const leaseSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().min(1, "Unit is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  monthlyRent: z.coerce.number().positive("Monthly rent must be greater than 0"),
  securityDeposit: z.coerce.number().min(0).optional().or(z.literal("")),
  terms: z.string().optional(),
});

type LeaseFormValues = z.infer<typeof leaseSchema>;

// ---------- Types ----------

interface PropertyOption {
  id: string;
  name: string;
  units: { id: string; label: string; status: string }[];
}

interface TenantOption {
  id: string;
  name: string;
}

// ---------- Page ----------

export default function CreateLeasePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(leaseSchema) as any,
    defaultValues: {
      propertyId: "",
      unitId: "",
      tenantId: "",
      startDate: "",
      endDate: "",
      monthlyRent: "" as unknown as number,
      securityDeposit: "",
      terms: "",
    },
  });

  const selectedPropertyId = watch("propertyId");
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const unitOptions = (selectedProperty?.units ?? []).map((u) => ({
    value: u.id,
    label: `${u.label} (${u.status.charAt(0) + u.status.slice(1).toLowerCase()})`,
  }));

  // ---------- Fetch data ----------

  const fetchData = useCallback(async () => {
    try {
      const [propsRes, tenantsRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/tenants?status=ACTIVE"),
      ]);

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        setProperties(propsData);
      }

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData);
      }
    } catch {
      toast({ type: "error", title: "Failed to load form data" });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Submit ----------

  async function onSubmit(data: LeaseFormValues) {
    const payload = {
      unitId: data.unitId,
      tenantId: data.tenantId,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: data.monthlyRent,
      securityDeposit:
        data.securityDeposit === "" ? null : Number(data.securityDeposit),
      terms: data.terms || null,
    };

    try {
      const res = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create lease");
      }

      toast({ type: "success", title: "Lease created" });
      router.push(`/tenants/${data.tenantId}`);
    } catch (err) {
      toast({
        type: "error",
        title: err instanceof Error ? err.message : "Failed to create lease",
      });
    }
  }

  // ---------- Render ----------

  const propertyOptions = properties.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const tenantOptions = tenants.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        href="/leases"
      >
        Leases
      </Button>

      <h1 className="text-2xl font-bold text-gray-900">Create Lease</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Property & Unit */}
        <Card padding="md">
          <CardContent>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Property & Unit
            </h2>
            <div className="space-y-4">
              <Select
                label="Property"
                placeholder="Select a property"
                options={propertyOptions}
                error={errors.propertyId?.message}
                disabled={loadingData}
                {...register("propertyId")}
              />
              <Select
                label="Unit"
                placeholder={
                  selectedPropertyId
                    ? unitOptions.length > 0
                      ? "Select a unit"
                      : "No units available"
                    : "Select a property first"
                }
                options={unitOptions}
                error={errors.unitId?.message}
                disabled={!selectedPropertyId || unitOptions.length === 0}
                {...register("unitId")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Tenant */}
        <Card padding="md">
          <CardContent>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Tenant
            </h2>
            {tenants.length === 0 && !loadingData ? (
              <div className="text-sm text-gray-500">
                No active tenants available.{" "}
                <Button
                  variant="ghost"
                  size="sm"
                  href="/tenants/new"
                  className="inline text-blue-600 hover:text-blue-700 p-0 h-auto"
                >
                  Create a tenant
                </Button>{" "}
                first.
              </div>
            ) : (
              <Select
                label="Tenant"
                placeholder="Select a tenant"
                options={tenantOptions}
                error={errors.tenantId?.message}
                disabled={loadingData}
                {...register("tenantId")}
              />
            )}
          </CardContent>
        </Card>

        {/* Section 3: Lease Terms */}
        <Card padding="md">
          <CardContent>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Lease Terms
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  error={errors.startDate?.message}
                  {...register("startDate")}
                />
                <Input
                  label="End Date"
                  type="date"
                  error={errors.endDate?.message}
                  {...register("endDate")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Monthly Rent"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  leftAddon="$"
                  error={errors.monthlyRent?.message}
                  {...register("monthlyRent")}
                />
                <Input
                  label="Security Deposit"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  leftAddon="$"
                  error={errors.securityDeposit?.message}
                  {...register("securityDeposit")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Terms & Notes */}
        <Card padding="md">
          <CardContent>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Terms & Notes
            </h2>
            <Textarea
              label="Terms / Notes"
              placeholder="Any additional lease terms or notes..."
              rows={4}
              {...register("terms")}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/leases")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} loadingText="Creating...">
            Create Lease
          </Button>
        </div>
      </form>
    </div>
  );
}
