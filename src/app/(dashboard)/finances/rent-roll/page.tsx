"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Receipt,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Select,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "@/components/ui";
import { RentRollSummary } from "@/components/finances/RentRollSummary";
import {
  MarkPaidModal,
  type MarkPaidEntryData,
} from "@/components/finances/MarkPaidModal";
import { ApplyLateFeeButton } from "@/components/finances/ApplyLateFeeButton";
import { formatCurrency } from "@/lib/utils";

interface PropertyOption {
  id: string;
  name: string;
}

interface RentRollEntry {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  tenantId: string;
  tenantName: string;
  leaseId: string;
  monthlyRent: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  status: "paid" | "partial" | "unpaid" | "late";
}

interface RentRollData {
  entries: RentRollEntry[];
  summary: {
    totalExpected: number;
    totalCollected: number;
    outstanding: number;
    collectionRate: number;
  };
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function toMonthParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const statusConfig = {
  paid: { label: "Paid", variant: "success" as const, icon: CheckCircle2 },
  partial: { label: "Partial", variant: "warning" as const, icon: Clock },
  unpaid: { label: "Unpaid", variant: "danger" as const, icon: Clock },
  late: { label: "Late", variant: "danger" as const, icon: AlertTriangle },
};

export default function RentRollPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [propertyFilter, setPropertyFilter] = useState("");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [data, setData] = useState<RentRollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [markPaidEntry, setMarkPaidEntry] = useState<MarkPaidEntryData | null>(
    null
  );
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch properties
  useEffect(() => {
    fetch("/api/properties")
      .then((res) => (res.ok ? res.json() : []))
      .then((d) => setProperties(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Fetch rent roll
  const fetchRentRoll = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const params = new URLSearchParams({
        month: toMonthParam(currentMonth),
      });
      if (propertyFilter) params.set("propertyId", propertyFilter);

      const res = await fetch(`/api/rent-roll?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load rent roll");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, propertyFilter]);

  useEffect(() => {
    fetchRentRoll();
  }, [fetchRentRoll]);

  // Month navigation
  function prevMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }
  function nextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  // Checkbox handling
  const unpaidEntries =
    data?.entries.filter(
      (e) => e.status !== "paid"
    ) ?? [];

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === unpaidEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unpaidEntries.map((e) => e.id)));
    }
  }

  // Batch mark paid
  async function handleBatchMarkPaid() {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      const entries =
        data?.entries.filter((e) => selectedIds.has(e.id)) ?? [];
      const promises = entries.map((entry) =>
        fetch("/api/rent-roll/mark-paid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitId: entry.unitId,
            tenantId: entry.tenantId,
            propertyId: entry.propertyId,
            leaseId: entry.leaseId,
            amount: entry.amountDue,
            date: new Date().toISOString().split("T")[0],
            paymentMethod: "other",
          }),
        })
      );
      await Promise.all(promises);
      fetchRentRoll();
    } catch {
      // errors handled by individual calls
    } finally {
      setBatchLoading(false);
    }
  }

  function openMarkPaid(entry: RentRollEntry) {
    setMarkPaidEntry({
      unitId: entry.unitId,
      tenantId: entry.tenantId,
      propertyId: entry.propertyId,
      leaseId: entry.leaseId,
      monthlyRent: entry.monthlyRent,
      amountDue: entry.amountDue,
      tenantName: entry.tenantName,
    });
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rent Roll</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track monthly rent collection across all properties.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ApplyLateFeeButton
            month={toMonthParam(currentMonth)}
            propertyId={propertyFilter || undefined}
            onSuccess={fetchRentRoll}
          />
        </div>
      </div>

      {/* Month nav + property filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[160px] text-center text-sm font-semibold text-gray-900">
            {formatMonth(currentMonth)}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            options={[
              { value: "", label: "All Properties" },
              ...properties.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
      </div>

      {/* Summary cards */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" count={1} />
          ))}
        </div>
      )}

      {!loading && data?.summary && (
        <RentRollSummary
          totalExpected={data.summary.totalExpected}
          totalCollected={data.summary.totalCollected}
          outstanding={data.summary.outstanding}
          collectionRate={data.summary.collectionRate}
        />
      )}

      {/* Batch actions bar */}
      {selectedIds.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">
                {selectedIds.size} entr{selectedIds.size === 1 ? "y" : "ies"}{" "}
                selected
              </span>
              <Button
                size="sm"
                onClick={handleBatchMarkPaid}
                loading={batchLoading}
                loadingText="Processing..."
              >
                Mark Selected as Paid
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rent roll table / cards */}
      <Card>
        {loading && (
          <div className="px-6 py-4">
            <LoadingSkeleton variant="text" count={8} />
          </div>
        )}

        {!loading && (!data || data.entries.length === 0) && (
          <div className="px-6 py-8">
            <EmptyState
              icon={Receipt}
              title="No rent roll entries"
              description="There are no active leases for this month, or rent roll data is not yet available."
            />
          </div>
        )}

        {!loading && data && data.entries.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/50">
                  <tr>
                    <th className="h-10 px-4 text-left w-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={
                          unpaidEntries.length > 0 &&
                          selectedIds.size === unpaidEntries.length
                        }
                        onChange={toggleSelectAll}
                        disabled={unpaidEntries.length === 0}
                      />
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Property
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Rent Amount
                    </th>
                    <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Due
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="h-10 px-4 text-center font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.entries.map((entry) => {
                    const config = statusConfig[entry.status];
                    const StatusIcon = config.icon;
                    const isUnpaid = entry.status !== "paid";

                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {isUnpaid ? (
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedIds.has(entry.id)}
                              onChange={() => toggleSelect(entry.id)}
                            />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {entry.propertyName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {entry.unitName}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {entry.tenantName}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(entry.monthlyRent)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(entry.amountPaid)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(entry.amountDue)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={config.variant} dot>
                            {entry.status === "late" && (
                              <StatusIcon className="h-3 w-3" />
                            )}
                            {config.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isUnpaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMarkPaid(entry)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.entries.map((entry) => {
                const config = statusConfig[entry.status];
                const StatusIcon = config.icon;
                const isUnpaid = entry.status !== "paid";

                return (
                  <div key={entry.id} className="px-4 py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {isUnpaid && (
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                            checked={selectedIds.has(entry.id)}
                            onChange={() => toggleSelect(entry.id)}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {entry.tenantName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {entry.propertyName} — {entry.unitName}
                          </p>
                        </div>
                      </div>
                      <Badge variant={config.variant} dot size="sm">
                        {entry.status === "late" && (
                          <StatusIcon className="h-3 w-3" />
                        )}
                        {config.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Rent</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(entry.monthlyRent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Paid</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(entry.amountPaid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Due</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(entry.amountDue)}
                        </p>
                      </div>
                    </div>
                    {isUnpaid && (
                      <Button
                        size="sm"
                        variant="outline"
                        fullWidth
                        onClick={() => openMarkPaid(entry)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Mark Paid Modal */}
      {markPaidEntry && (
        <MarkPaidModal
          isOpen={!!markPaidEntry}
          onClose={() => setMarkPaidEntry(null)}
          onSuccess={fetchRentRoll}
          entry={markPaidEntry}
        />
      )}
    </div>
  );
}
