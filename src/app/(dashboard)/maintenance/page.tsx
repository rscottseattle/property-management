"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Plus } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Select,
} from "@/components/ui";
import { MaintenanceCard, type MaintenanceCardData } from "@/components/maintenance/MaintenanceCard";

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const PRIORITY_FILTERS = [
  { value: "ALL", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "EMERGENCY", label: "Emergency" },
];

interface PropertyOption {
  id: string;
  name: string;
}

function CardSkeleton() {
  return (
    <div className="flex items-stretch rounded-lg border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="w-1.5 bg-gray-200" />
      <div className="flex-1 px-4 py-3 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-2/5" />
        <div className="h-3 bg-gray-200 rounded w-3/5" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-full w-20" />
          <div className="h-5 bg-gray-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceCardData[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [propertyFilter, setPropertyFilter] = useState("ALL");

  useEffect(() => {
    async function fetchData() {
      try {
        const [reqRes, propRes] = await Promise.all([
          fetch("/api/maintenance"),
          fetch("/api/properties"),
        ]);
        if (!reqRes.ok) throw new Error("Failed to load maintenance requests");
        const reqData = await reqRes.json();
        setRequests(reqData);

        if (propRes.ok) {
          const propData = await propRes.json();
          setProperties(propData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && r.priority !== priorityFilter) return false;
    if (propertyFilter !== "ALL" && r.property?.id !== propertyFilter) return false;
    return true;
  });

  const propertyOptions = [
    { value: "ALL", label: "All Properties" },
    ...properties.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage maintenance requests across your properties.
          </p>
        </div>
        <Button
          href="/maintenance/new"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Request
        </Button>
      </div>

      {/* Filter bar */}
      {!loading && !error && requests.length > 0 && (
        <div className="space-y-3">
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf.value}
                type="button"
                onClick={() => setStatusFilter(sf.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  statusFilter === sf.value
                    ? "bg-[#e8f0e9] text-[#3d5e44] border-[#b8ccbe]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* Priority + property filters */}
          <div className="flex flex-wrap gap-3">
            <div className="w-44">
              <Select
                options={PRIORITY_FILTERS}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              />
            </div>
            <div className="w-52">
              <Select
                options={propertyOptions}
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
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
                fetch("/api/maintenance")
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed to load maintenance requests");
                    return res.json();
                  })
                  .then(setRequests)
                  .catch((err) =>
                    setError(
                      err instanceof Error ? err.message : "Something went wrong"
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
      {!loading && !error && requests.length === 0 && (
        <Card>
          <EmptyState
            icon={Wrench}
            title="No maintenance requests"
            description="Create your first maintenance request to start tracking work orders."
            action={
              <Button
                href="/maintenance/new"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New Request
              </Button>
            }
          />
        </Card>
      )}

      {/* Filtered empty */}
      {!loading && !error && requests.length > 0 && filtered.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              No requests match the current filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setPropertyFilter("ALL");
              }}
            >
              Clear filters
            </Button>
          </div>
        </Card>
      )}

      {/* Request list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((request) => (
            <MaintenanceCard
              key={request.id}
              request={request}
              onClick={() => router.push(`/maintenance/${request.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
