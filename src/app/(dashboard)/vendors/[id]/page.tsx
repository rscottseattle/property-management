"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  HardHat,
  Mail,
  Phone,
  Globe,
  Pencil,
  Trash2,
  Wrench,
  DollarSign,
  Calculator,
  Star,
  FileText,
  Receipt,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoadingSkeleton,
  EmptyState,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { StarRating } from "@/components/vendors/StarRating";

// ---------- Types ----------

interface MaintenanceRequestData {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  property: {
    id: string;
    name: string;
  };
  transactions: {
    id: string;
    amount: number | string;
  }[];
}

interface TransactionData {
  id: string;
  date: string;
  category: string;
  amount: number | string;
  receiptUrl: string | null;
  property: {
    id: string;
    name: string;
  };
}

interface VendorData {
  id: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  rating: number | null;
  maintenanceRequests: MaintenanceRequestData[];
  transactions: TransactionData[];
}

type TabKey = "work-history" | "expenses";

// ---------- Helpers ----------

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "info" | "warning" | "success" | "neutral" | "default" }
> = {
  SUBMITTED: { label: "Submitted", variant: "neutral" },
  ACKNOWLEDGED: { label: "Acknowledged", variant: "info" },
  SCHEDULED: { label: "Scheduled", variant: "info" },
  IN_PROGRESS: { label: "In Progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
};

const TRADE_COLORS: Record<string, { bg: string; text: string }> = {
  Plumber: { bg: "bg-[#e5eef5]", text: "text-[#4a6f8a]" },
  Electrician: { bg: "bg-[#f5eddc]", text: "text-[#8a6d2f]" },
  HVAC: { bg: "bg-[#e5eef5]", text: "text-[#4a6f8a]" },
  "General Contractor": { bg: "bg-gray-100", text: "text-gray-700" },
  Painter: { bg: "bg-[#f5eddc]", text: "text-[#8a6d2f]" },
  Landscaper: { bg: "bg-[#e8f0e9]", text: "text-[#3d5e44]" },
  Cleaner: { bg: "bg-[#e8f0e9]", text: "text-[#3d5e44]" },
  Roofer: { bg: "bg-[#fae8e3]", text: "text-[#a04025]" },
  "Appliance Repair": { bg: "bg-[#fae8e3]", text: "text-[#a04025]" },
  Locksmith: { bg: "bg-[#e5eef5]", text: "text-[#4a6f8a]" },
  "Pest Control": { bg: "bg-[#fae8e3]", text: "text-[#a04025]" },
  Other: { bg: "bg-gray-50", text: "text-gray-600" },
};

function getStatusBadge(status: string) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "neutral" as const,
  };
  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}

// ---------- Stat Card ----------

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#e8f0e9] p-2.5">
          <Icon className="h-5 w-5 text-[#5c7c65]" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ---------- Tab Button ----------

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#5c7c65] text-[#5c7c65]"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

// ---------- Main Page ----------

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("work-history");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchVendor = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch vendor");
      const data = await res.json();
      setVendor(data);
    } catch {
      toast({ type: "error", title: "Failed to load vendor" });
    } finally {
      setLoading(false);
    }
  }, [vendorId, toast]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  // ---------- Delete vendor ----------

  async function handleDeleteVendor() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete vendor");
      toast({ type: "success", title: "Vendor deleted" });
      router.push("/vendors");
    } catch {
      toast({ type: "error", title: "Failed to delete vendor" });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  // ---------- Computed ----------

  const totalJobs = vendor?.maintenanceRequests?.length ?? 0;
  const totalSpend = vendor?.transactions?.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  ) ?? 0;
  const avgJobCost = totalJobs > 0 ? totalSpend / totalJobs : 0;

  // Sort maintenance requests by date desc
  const sortedRequests = [...(vendor?.maintenanceRequests ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Sort transactions by date desc
  const sortedTransactions = [...(vendor?.transactions ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" count={2} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
        </div>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  // ---------- Not found ----------

  if (notFound || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon={HardHat}
          title="Vendor not found"
          description="The vendor you're looking for doesn't exist or has been removed."
          action={
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              href="/vendors"
            >
              Back to Vendors
            </Button>
          }
        />
      </div>
    );
  }

  const tradeColor = TRADE_COLORS[vendor.trade] ?? TRADE_COLORS.Other;

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          href="/vendors"
          className="mb-4"
        >
          Vendors
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {vendor.name}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tradeColor.bg} ${tradeColor.text}`}
              >
                {vendor.trade}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {vendor.rating ? (
                <StarRating value={vendor.rating} size="sm" />
              ) : (
                <span className="text-sm text-gray-400">Not rated</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Pencil className="h-4 w-4" />}
              href="#"
            >
              Edit
            </Button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteVendor}
                  loading={deleteLoading}
                  loadingText="Deleting..."
                >
                  Confirm Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Phone
              </p>
              {vendor.phone ? (
                <a
                  href={`tel:${vendor.phone}`}
                  className="text-sm font-medium text-[#5c7c65] hover:text-[#3d5e44] flex items-center gap-1.5"
                >
                  <Phone className="h-4 w-4" />
                  {formatPhone(vendor.phone)}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </p>
              {vendor.email ? (
                <a
                  href={`mailto:${vendor.email}`}
                  className="text-sm font-medium text-[#5c7c65] hover:text-[#3d5e44] flex items-center gap-1.5"
                >
                  <Mail className="h-4 w-4" />
                  {vendor.email}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Website
              </p>
              {vendor.website ? (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#5c7c65] hover:text-[#3d5e44] flex items-center gap-1.5"
                >
                  <Globe className="h-4 w-4" />
                  {vendor.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>
          </div>

          {vendor.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {vendor.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={totalJobs} icon={Wrench} />
        <StatCard
          label="Total Spend"
          value={formatCurrency(totalSpend)}
          icon={DollarSign}
        />
        <StatCard
          label="Avg Job Cost"
          value={formatCurrency(avgJobCost)}
          icon={Calculator}
        />
        <StatCard
          label="Rating"
          value={vendor.rating ? `${vendor.rating}/5` : "N/A"}
          icon={Star}
        />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <TabButton
            label="Work History"
            active={activeTab === "work-history"}
            onClick={() => setActiveTab("work-history")}
          />
          <TabButton
            label="Expenses"
            active={activeTab === "expenses"}
            onClick={() => setActiveTab("expenses")}
          />
        </div>

        <div className="mt-6">
          {/* Work History Tab */}
          {activeTab === "work-history" && (
            <div>
              {sortedRequests.length > 0 ? (
                <div className="space-y-3">
                  {sortedRequests.map((req) => {
                    const linkedExpense = req.transactions?.reduce(
                      (sum, t) => sum + Number(t.amount),
                      0
                    );
                    return (
                      <Card key={req.id} padding="sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {req.title}
                              </h4>
                              {getStatusBadge(req.status)}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {req.property.name} &middot;{" "}
                              {formatDate(req.createdAt)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {linkedExpense > 0 && (
                              <span className="text-sm font-medium text-gray-700">
                                {formatCurrency(linkedExpense)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <EmptyState
                    icon={Wrench}
                    title="No work history"
                    description="Maintenance requests assigned to this vendor will appear here."
                  />
                </Card>
              )}
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === "expenses" && (
            <div>
              {sortedTransactions.length > 0 ? (
                <div className="space-y-3">
                  {sortedTransactions.map((txn) => (
                    <Card key={txn.id} padding="sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">
                              {txn.category}
                            </span>
                            {txn.receiptUrl && (
                              <Badge variant="info" size="sm">
                                <Receipt className="h-3 w-3 mr-1" />
                                Receipt
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {txn.property.name} &middot;{" "}
                            {formatDate(txn.date)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(Number(txn.amount))}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Total */}
                  <Card padding="sm">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900">
                        Total
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(totalSpend)}
                      </span>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card>
                  <EmptyState
                    icon={DollarSign}
                    title="No expenses"
                    description="Transactions linked to this vendor will appear here."
                  />
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
