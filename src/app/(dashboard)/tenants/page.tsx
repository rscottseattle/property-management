"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Plus, Mail, Phone, Building2 } from "lucide-react";
import {
  Button,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
  Select,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TenantLease {
  id: string;
  monthlyRent: number | string;
  endDate: string;
  renewalStatus: string;
}

interface TenantUnit {
  id: string;
  label: string;
  property: {
    id: string;
    name: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "ARCHIVED";
  unit: TenantUnit | null;
  leases: TenantLease[];
}

function TenantCardSkeleton() {
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
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
        </div>
      </div>
    </Card>
  );
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchTenants() {
      try {
        const url =
          statusFilter === "ALL"
            ? "/api/tenants"
            : `/api/tenants?status=${statusFilter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load tenants");
        const data = await res.json();
        setTenants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    setError(null);
    fetchTenants();
  }, [statusFilter]);

  function getActiveLease(tenant: Tenant): TenantLease | undefined {
    return tenant.leases?.find(
      (l) =>
        l.renewalStatus === "ACTIVE" || l.renewalStatus === "MONTH_TO_MONTH"
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tenants</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your tenants and lease agreements.
          </p>
        </div>
        <Button
          href="/tenants/new"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Tenant
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          options={[
            { value: "ALL", label: "All Tenants" },
            { value: "ACTIVE", label: "Active" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TenantCardSkeleton key={i} />
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
                const url =
                  statusFilter === "ALL"
                    ? "/api/tenants"
                    : `/api/tenants?status=${statusFilter}`;
                fetch(url)
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed to load tenants");
                    return res.json();
                  })
                  .then(setTenants)
                  .catch((err) =>
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Something went wrong"
                    )
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
      {!loading && !error && tenants.length === 0 && (
        <Card>
          <EmptyState
            icon={User}
            title="No tenants yet"
            description="Add your first tenant to start managing your rental relationships."
            action={
              <Button
                href="/tenants/new"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Tenant
              </Button>
            }
          />
        </Card>
      )}

      {/* Tenant grid */}
      {!loading && !error && tenants.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => {
            const activeLease = getActiveLease(tenant);
            const propertyName = tenant.unit
              ? `${tenant.unit.property.name} - ${tenant.unit.label}`
              : "Unassigned";

            return (
              <Card
                key={tenant.id}
                hover
                className="cursor-pointer"
                onClick={() => router.push(`/tenants/${tenant.id}`)}
              >
                <div className="p-5 space-y-3">
                  {/* Header: avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0e9]">
                      <User className="h-5 w-5 text-[#5c7c65]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {tenant.name}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {propertyName}
                      </p>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1">
                    {tenant.email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {tenant.email}
                      </p>
                    )}
                    {tenant.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                        <Phone className="h-3 w-3 shrink-0" />
                        {tenant.phone}
                      </p>
                    )}
                  </div>

                  {/* Status + lease info */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {tenant.status === "ACTIVE" ? (
                      <Badge variant="success" size="sm" dot>
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm" dot>
                        Archived
                      </Badge>
                    )}
                  </div>

                  {/* Lease info */}
                  <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
                    {activeLease ? (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          {formatCurrency(Number(activeLease.monthlyRent))}/mo
                        </span>
                        <span>
                          Lease ends {formatDate(activeLease.endDate)}
                        </span>
                      </div>
                    ) : (
                      <span>No active lease</span>
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
