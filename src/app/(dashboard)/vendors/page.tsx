"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat, Plus } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Select,
} from "@/components/ui";
import { VendorCard } from "@/components/vendors/VendorCard";

interface VendorListItem {
  id: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
  rating: number | null;
  _count?: { maintenanceRequests: number };
  totalSpend?: number;
  jobCount?: number;
}

const TRADE_OPTIONS = [
  { value: "ALL", label: "All Trades" },
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

function VendorCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-5 bg-gray-200 rounded w-2/5" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-4 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/5" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </Card>
  );
}

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeFilter, setTradeFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchVendors() {
      try {
        const url =
          tradeFilter === "ALL"
            ? "/api/vendors"
            : `/api/vendors?trade=${encodeURIComponent(tradeFilter)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load vendors");
        const data = await res.json();
        setVendors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    setError(null);
    fetchVendors();
  }, [tradeFilter]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your service providers and contractors.
          </p>
        </div>
        <Button
          href="/vendors/new"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Vendor
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          options={TRADE_OPTIONS}
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VendorCardSkeleton key={i} />
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
                  tradeFilter === "ALL"
                    ? "/api/vendors"
                    : `/api/vendors?trade=${encodeURIComponent(tradeFilter)}`;
                fetch(url)
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed to load vendors");
                    return res.json();
                  })
                  .then(setVendors)
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
      {!loading && !error && vendors.length === 0 && (
        <Card>
          <EmptyState
            icon={HardHat}
            title="No vendors yet"
            description="Add your first vendor to start tracking your service providers."
            action={
              <Button
                href="/vendors/new"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Vendor
              </Button>
            }
          />
        </Card>
      )}

      {/* Vendor grid */}
      {!loading && !error && vendors.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={{
                id: vendor.id,
                name: vendor.name,
                trade: vendor.trade,
                phone: vendor.phone,
                email: vendor.email,
                rating: vendor.rating,
                jobCount:
                  vendor.jobCount ??
                  vendor._count?.maintenanceRequests ??
                  0,
                totalSpend: vendor.totalSpend ?? 0,
              }}
              onClick={() => router.push(`/vendors/${vendor.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
