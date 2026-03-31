"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import {
  Button,
  Card,
  LoadingSkeleton,
  EmptyState,
  useToast,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LeaseStatusBadge } from "@/components/leases/LeaseStatusBadge";
import { LeaseCard, type LeaseData } from "@/components/leases/LeaseCard";

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRING_SOON", label: "Expiring Soon" },
  { value: "EXPIRED", label: "Expired" },
  { value: "MONTH_TO_MONTH", label: "Month-to-Month" },
];

export default function LeasesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [leases, setLeases] = useState<LeaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchLeases = useCallback(async () => {
    try {
      const res = await fetch("/api/leases");
      if (!res.ok) throw new Error("Failed to fetch leases");
      const data = await res.json();
      setLeases(data);
    } catch {
      toast({ type: "error", title: "Failed to load leases" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  const filteredLeases =
    statusFilter === "ALL"
      ? leases
      : leases.filter((l) => l.renewalStatus === statusFilter);

  // ---------- Loading ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" count={1} />
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          href="/leases/new"
        >
          Create Lease
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              statusFilter === filter.value
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredLeases.length === 0 && !loading && (
        <EmptyState
          icon={FileText}
          title="No leases yet"
          description={
            statusFilter === "ALL"
              ? "Create your first lease to start tracking rental agreements."
              : "No leases match the selected filter."
          }
          action={
            statusFilter === "ALL" ? (
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                href="/leases/new"
              >
                Create Lease
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Desktop Table */}
      {filteredLeases.length > 0 && (
        <>
          <div className="hidden md:block">
            <Card padding="none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeases.map((lease) => (
                    <TableRow
                      key={lease.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/tenants/${lease.tenant.id}`)}
                    >
                      <TableCell>
                        <p className="font-medium text-gray-900">
                          {lease.unit.property.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lease.unit.label}
                        </p>
                      </TableCell>
                      <TableCell>{lease.tenant.name}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(lease.monthlyRent))}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(lease.startDate)} &mdash;{" "}
                        {formatDate(lease.endDate)}
                      </TableCell>
                      <TableCell>
                        <LeaseStatusBadge status={lease.renewalStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filteredLeases.map((lease) => (
              <LeaseCard
                key={lease.id}
                lease={lease}
                onClick={() => router.push(`/tenants/${lease.tenant.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
