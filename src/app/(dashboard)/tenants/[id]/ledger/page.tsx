"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Plus,
  DollarSign,
} from "lucide-react";
import {
  Button,
  Card,
  Input,
  LoadingSkeleton,
  EmptyState,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/csv-export";
import {
  LedgerEntry,
  LedgerEntryCard,
  type LedgerEntryData,
} from "@/components/tenants/LedgerEntry";
import { LedgerSummary } from "@/components/tenants/LedgerSummary";
import { AddCreditModal } from "@/components/tenants/AddCreditModal";

interface TenantBasic {
  id: string;
  name: string;
  unit: {
    id: string;
    label: string;
    property: {
      id: string;
      name: string;
    };
  } | null;
}

interface LedgerResponse {
  entries: LedgerEntryData[];
  totalCharges: number;
  totalPayments: number;
  totalCredits: number;
  currentBalance: number;
}

export default function TenantLedgerPage() {
  const params = useParams();
  const { toast } = useToast();

  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantBasic | null>(null);
  const [ledger, setLedger] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditModalOpen, setCreditModalOpen] = useState(false);

  // Date range filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch tenant");
      const data = await res.json();
      setTenant(data);
    } catch {
      toast({ type: "error", title: "Failed to load tenant" });
    }
  }, [tenantId, toast]);

  const fetchLedger = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const qs = params.toString();

      const res = await fetch(
        `/api/tenants/${tenantId}/ledger${qs ? `?${qs}` : ""}`
      );
      if (!res.ok) throw new Error("Failed to fetch ledger");
      const data = await res.json();
      setLedger(data);
    } catch {
      toast({ type: "error", title: "Failed to load ledger" });
    }
  }, [tenantId, startDate, endDate, toast]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchTenant(), fetchLedger()]);
      setLoading(false);
    }
    load();
  }, [fetchTenant, fetchLedger]);

  function handleExportCSV() {
    if (!ledger || ledger.entries.length === 0) return;

    const rows = ledger.entries.map((e) => ({
      Date: formatDate(e.date),
      Type: e.type,
      Description: e.description,
      Charge: e.chargeAmount ?? "",
      Payment: e.paymentAmount ?? "",
      "Running Balance": e.runningBalance,
    }));

    const tenantName = tenant?.name?.replace(/\s+/g, "_") ?? "tenant";
    exportToCSV(rows, `ledger_${tenantName}_${new Date().toISOString().split("T")[0]}`);
  }

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" count={2} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
        </div>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  // ---------- Render ----------

  const entries = ledger?.entries ?? [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        href={`/tenants/${tenantId}`}
        className="mb-2"
      >
        Back to Tenant
      </Button>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ledger: {tenant?.name ?? "Tenant"}
          </h1>
          {tenant?.unit && (
            <p className="mt-1 text-sm text-gray-500">
              {tenant.unit.property.name} &mdash; {tenant.unit.label}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreditModalOpen(true)}
          >
            Add Credit
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportCSV}
            disabled={entries.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Balance summary cards */}
      {ledger && (
        <LedgerSummary
          totalCharges={ledger.totalCharges}
          totalPayments={ledger.totalPayments}
          totalCredits={ledger.totalCredits}
          currentBalance={ledger.currentBalance}
        />
      )}

      {/* Ledger table */}
      {entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={DollarSign}
            title="No ledger entries"
            description="Charges, payments, and credits will appear here."
          />
        </Card>
      ) : (
        <Card>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/50">
                <tr>
                  <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Type
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Description
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Charge
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <LedgerEntry key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-100">
            {entries.map((entry) => (
              <LedgerEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </Card>
      )}

      {/* Footer */}
      {ledger && entries.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-6 py-4">
          <div className="text-sm text-gray-600">
            Current Balance:{" "}
            <span
              className={`text-base font-semibold ${
                ledger.currentBalance > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(ledger.currentBalance)}
            </span>
          </div>
          <Button
            size="sm"
            href={`/finances/new?type=INCOME&tenantId=${tenantId}`}
            leftIcon={<DollarSign className="h-4 w-4" />}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Record Payment
          </Button>
        </div>
      )}

      {/* Add Credit Modal */}
      <AddCreditModal
        isOpen={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        tenantId={tenantId}
        tenantName={tenant?.name ?? "Tenant"}
        onSuccess={() => {
          fetchLedger();
        }}
      />
    </div>
  );
}
