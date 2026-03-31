"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Car, Download, Plus } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Modal,
  ModalFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingSkeleton,
  EmptyState,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/csv-export";

// ---------- Types ----------

interface MileageEntry {
  id: string;
  date: string;
  distance: number;
  fromLocation: string | null;
  toLocation: string | null;
  purpose: string;
  propertyId: string | null;
  propertyName: string | null;
}

interface MileageSummary {
  entries: MileageEntry[];
  totalMiles: number;
  totalDeduction: number;
  tripCount: number;
}

// ---------- Constants ----------

const IRS_MILEAGE_RATE = 0.7; // 2026 rate
const currentYear = new Date().getFullYear();

// ---------- Page ----------

export default function MileagePage() {
  const { toast } = useToast();

  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(
    `${currentYear}-12-31`
  );
  const [data, setData] = useState<MileageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<
    { value: string; label: string }[]
  >([]);

  // Form state
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formDistance, setFormDistance] = useState("");
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formPurpose, setFormPurpose] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");

  // Fetch properties
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/properties");
        if (!res.ok) return;
        const json = await res.json();
        const list = (json.properties ?? json ?? []).map(
          (p: { id: string; name: string }) => ({
            value: p.id,
            label: p.name,
          })
        );
        setProperties(list);
      } catch {
        /* silent */
      }
    }
    load();
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/mileage?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      // If the API returns raw entries, compute summary client-side
      const entries: MileageEntry[] = json.entries ?? json ?? [];
      const totalMiles = entries.reduce((s, e) => s + e.distance, 0);
      setData({
        entries,
        totalMiles,
        totalDeduction: totalMiles * IRS_MILEAGE_RATE,
        tripCount: entries.length,
      });
    } catch {
      setData({ entries: [], totalMiles: 0, totalDeduction: 0, tripCount: 0 });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch on mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function resetForm() {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDistance("");
    setFormFrom("");
    setFormTo("");
    setFormPurpose("");
    setFormPropertyId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formDate || !formDistance || !formPurpose) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        date: formDate,
        distance: Number(formDistance),
        purpose: formPurpose,
      };
      if (formFrom) body.fromLocation = formFrom;
      if (formTo) body.toLocation = formTo;
      if (formPropertyId) body.propertyId = formPropertyId;

      const res = await fetch("/api/mileage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ type: "success", title: "Mileage entry added" });
      setModalOpen(false);
      resetForm();
      fetchEntries();
    } catch {
      toast({ type: "error", title: "Failed to add mileage entry" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportCSV() {
    if (!data) return;
    const rows = data.entries.map((e) => ({
      Date: formatDate(e.date),
      From: e.fromLocation ?? "",
      To: e.toLocation ?? "",
      Purpose: e.purpose,
      Miles: e.distance,
      Deduction: (e.distance * IRS_MILEAGE_RATE).toFixed(2),
      Property: e.propertyName ?? "",
    }));
    exportToCSV(rows, `mileage-log-${currentYear}.csv`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          href="/reports"
          className="mb-4"
        >
          Reports
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Mileage Log
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track mileage for property visits and claim deductions.
            </p>
          </div>
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setModalOpen(true)}
          >
            Add Mileage Entry
          </Button>
        </div>
      </div>

      {/* Date filter */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-44">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchEntries} loading={loading}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {loading && <LoadingSkeleton variant="card" count={1} />}

      {/* Summary cards */}
      {!loading && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card padding="md">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Miles
                </p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {data.totalMiles.toLocaleString("en-US", {
                    maximumFractionDigits: 1,
                  })}
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Deduction
                </p>
                <p className="text-2xl font-semibold text-[#5c7c65] mt-1">
                  {formatCurrency(data.totalDeduction)}
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Trip Count
                </p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {data.tripCount}
                </p>
              </div>
            </Card>
          </div>

          {/* Table */}
          {data.entries.length > 0 ? (
            <Card>
              <CardContent className="px-0 py-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500">
                    IRS Standard Mileage Rate: $0.70/mile (2026)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead className="text-right">Miles</TableHead>
                      <TableHead className="text-right">Deduction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.entries.map((entry) => (
                      <TableRow key={entry.id} hoverable>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell>
                          {entry.fromLocation || entry.toLocation
                            ? `${entry.fromLocation ?? "—"} → ${entry.toLocation ?? "—"}`
                            : "—"}
                        </TableCell>
                        <TableCell>{entry.purpose}</TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.distance.toLocaleString("en-US", {
                            maximumFractionDigits: 1,
                          })}
                        </TableCell>
                        <TableCell className="text-right text-[#5c7c65] font-medium">
                          {formatCurrency(entry.distance * IRS_MILEAGE_RATE)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Car}
              title="No mileage entries"
              description="Add your first mileage entry to start tracking property visit deductions."
              action={
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setModalOpen(true)}
                >
                  Add Entry
                </Button>
              }
            />
          )}
        </>
      )}

      {/* Add Mileage Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title="Add Mileage Entry"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
            <Input
              label="Distance (miles)"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 12.5"
              value={formDistance}
              onChange={(e) => setFormDistance(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="From Location"
              placeholder="e.g. Home office"
              value={formFrom}
              onChange={(e) => setFormFrom(e.target.value)}
            />
            <Input
              label="To Location"
              placeholder="e.g. 123 Main St"
              value={formTo}
              onChange={(e) => setFormTo(e.target.value)}
            />
          </div>
          <Input
            label="Purpose"
            placeholder="e.g. Property inspection, tenant showing"
            value={formPurpose}
            onChange={(e) => setFormPurpose(e.target.value)}
            required
          />
          <Select
            label="Property (optional)"
            options={[{ value: "", label: "None" }, ...properties]}
            value={formPropertyId}
            onChange={(e) => setFormPropertyId(e.target.value)}
          />

          <ModalFooter className="px-0 border-0">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} loadingText="Saving...">
              Add Entry
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
