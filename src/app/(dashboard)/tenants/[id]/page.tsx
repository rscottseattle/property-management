"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  AlertTriangle,
  Pencil,
  Trash2,
  Archive,
  DollarSign,
  Wrench,
  FileText,
  CreditCard,
  MessageSquare,
  Plus,
  Calendar,
  Shield,
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
import { CommunicationLogEntry } from "@/components/tenants/CommunicationLogEntry";
import { AddCommunicationLogModal } from "@/components/tenants/AddCommunicationLogModal";

// ---------- Types ----------

interface LeaseData {
  id: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number | string;
  securityDeposit: number | string | null;
  renewalStatus: string;
  terms: string | null;
  unit: {
    id: string;
    label: string;
    property: {
      id: string;
      name: string;
    };
  };
}

interface CommunicationLogData {
  id: string;
  date: string;
  method: "CALL" | "TEXT" | "EMAIL" | "IN_PERSON" | "OTHER";
  note: string;
  createdAt: string;
}

interface TenantData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  moveInDate: string | null;
  moveOutDate: string | null;
  notes: string | null;
  status: "ACTIVE" | "ARCHIVED";
  unit: {
    id: string;
    label: string;
    property: {
      id: string;
      name: string;
    };
  } | null;
  leases: LeaseData[];
  communicationLogs: CommunicationLogData[];
}

type TabKey = "leases" | "communication" | "documents" | "payments";

// ---------- Helpers ----------

function getStatusBadge(status: string) {
  const variant = status === "ACTIVE" ? "success" : "neutral";
  return (
    <Badge variant={variant} dot size="sm">
      {status === "ACTIVE" ? "Active" : "Archived"}
    </Badge>
  );
}

function getLeaseBadge(status: string) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "neutral" | "info" }> = {
    ACTIVE: { label: "Active", variant: "success" },
    EXPIRING_SOON: { label: "Expiring Soon", variant: "warning" },
    EXPIRED: { label: "Expired", variant: "neutral" },
    MONTH_TO_MONTH: { label: "Month-to-Month", variant: "info" },
    RENEWED: { label: "Renewed", variant: "success" },
  };
  const config = map[status] ?? { label: status, variant: "neutral" as const };
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
        <div className="rounded-lg bg-blue-50 p-2.5">
          <Icon className="h-5 w-5 text-blue-600" />
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
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

// ---------- Main Page ----------

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("leases");
  const [addLogOpen, setAddLogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch tenant");
      const data = await res.json();
      setTenant(data);
    } catch {
      toast({ type: "error", title: "Failed to load tenant" });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // ---------- Delete tenant ----------

  async function handleDeleteTenant() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete tenant");
      toast({ type: "success", title: "Tenant deleted" });
      router.push("/tenants");
    } catch {
      toast({ type: "error", title: "Failed to delete tenant" });
    } finally {
      setDeleteLoading(false);
    }
  }

  // ---------- Archive tenant ----------

  async function handleArchiveTenant() {
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!res.ok) throw new Error("Failed to archive tenant");
      toast({ type: "success", title: "Tenant archived" });
      fetchTenant();
    } catch {
      toast({ type: "error", title: "Failed to archive tenant" });
    }
  }

  // ---------- Computed ----------

  const activeLease = tenant?.leases?.find(
    (l) =>
      l.renewalStatus === "ACTIVE" || l.renewalStatus === "MONTH_TO_MONTH"
  );

  const pastLeases =
    tenant?.leases?.filter(
      (l) =>
        l.renewalStatus !== "ACTIVE" && l.renewalStatus !== "MONTH_TO_MONTH"
    ) ?? [];

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" count={2} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
        </div>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  // ---------- Not found ----------

  if (notFound || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon={User}
          title="Tenant not found"
          description="The tenant you're looking for doesn't exist or has been removed."
          action={
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              href="/tenants"
            >
              Back to Tenants
            </Button>
          }
        />
      </div>
    );
  }

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          href="/tenants"
          className="mb-4"
        >
          Tenants
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {tenant.name}
              </h1>
              {getStatusBadge(tenant.status)}
            </div>
            {tenant.unit && (
              <p className="mt-1 text-sm text-gray-500">
                {tenant.unit.property.name} &mdash; {tenant.unit.label}
              </p>
            )}
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
            {tenant.status === "ACTIVE" && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Archive className="h-4 w-4" />}
                onClick={handleArchiveTenant}
              >
                Archive
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={handleDeleteTenant}
              loading={deleteLoading}
              loadingText="Deleting..."
            >
              Delete
            </Button>
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
                Name
              </p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <User className="h-4 w-4 text-gray-400" />
                {tenant.name}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </p>
              {tenant.email ? (
                <a
                  href={`mailto:${tenant.email}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                >
                  <Mail className="h-4 w-4" />
                  {tenant.email}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Phone
              </p>
              {tenant.phone ? (
                <a
                  href={`tel:${tenant.phone}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                >
                  <Phone className="h-4 w-4" />
                  {formatPhone(tenant.phone)}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Emergency Contact
              </p>
              {tenant.emergencyContact ? (
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                  {tenant.emergencyContact}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Emergency Phone
              </p>
              {tenant.emergencyPhone ? (
                <a
                  href={`tel:${tenant.emergencyPhone}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                >
                  <Phone className="h-4 w-4" />
                  {formatPhone(tenant.emergencyPhone)}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Move-in Date
              </p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                {tenant.moveInDate
                  ? formatDate(tenant.moveInDate)
                  : "Not set"}
              </p>
              {tenant.moveOutDate && (
                <>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-2">
                    Move-out Date
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(tenant.moveOutDate)}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Active Lease"
          value={
            activeLease
              ? `${formatCurrency(Number(activeLease.monthlyRent))}/mo`
              : "None"
          }
          icon={FileText}
        />
        <StatCard
          label="Total Paid"
          value={formatCurrency(0)}
          icon={DollarSign}
        />
        <StatCard
          label="Open Requests"
          value={0}
          icon={Wrench}
        />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <TabButton
            label="Leases"
            active={activeTab === "leases"}
            onClick={() => setActiveTab("leases")}
          />
          <TabButton
            label="Communication Log"
            active={activeTab === "communication"}
            onClick={() => setActiveTab("communication")}
          />
          <TabButton
            label="Documents"
            active={activeTab === "documents"}
            onClick={() => setActiveTab("documents")}
          />
          <TabButton
            label="Payment History"
            active={activeTab === "payments"}
            onClick={() => setActiveTab("payments")}
          />
        </div>

        <div className="mt-6">
          {/* Leases Tab */}
          {activeTab === "leases" && (
            <div className="space-y-6">
              {/* Active lease */}
              {activeLease ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Active Lease</CardTitle>
                      {getLeaseBadge(activeLease.renewalStatus)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Unit
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {activeLease.unit.property.name} &mdash;{" "}
                          {activeLease.unit.label}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Lease Period
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(activeLease.startDate)} &ndash;{" "}
                          {formatDate(activeLease.endDate)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Monthly Rent
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(Number(activeLease.monthlyRent))}
                        </p>
                      </div>
                      {activeLease.securityDeposit && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Security Deposit
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(
                              Number(activeLease.securityDeposit)
                            )}
                          </p>
                        </div>
                      )}
                      {activeLease.terms && (
                        <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Terms
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {activeLease.terms}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <EmptyState
                    icon={FileText}
                    title="No active lease"
                    description="This tenant does not have an active lease."
                    action={
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        href="#"
                      >
                        Create Lease
                      </Button>
                    }
                  />
                </Card>
              )}

              {/* Lease history */}
              {pastLeases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Lease History
                  </h3>
                  <div className="space-y-3">
                    {pastLeases.map((lease) => (
                      <Card key={lease.id} padding="sm">
                        <div className="flex items-center justify-between flex-wrap gap-2 px-2">
                          <div className="flex items-center gap-3">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">
                                {lease.unit.property.name} &mdash;{" "}
                                {lease.unit.label}
                              </span>
                              <span className="text-gray-500 ml-2">
                                {formatDate(lease.startDate)} &ndash;{" "}
                                {formatDate(lease.endDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {formatCurrency(Number(lease.monthlyRent))}/mo
                            </span>
                            {getLeaseBadge(lease.renewalStatus)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Communication Log Tab */}
          {activeTab === "communication" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Communication History
                </h3>
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setAddLogOpen(true)}
                >
                  Add Entry
                </Button>
              </div>

              {tenant.communicationLogs &&
              tenant.communicationLogs.length > 0 ? (
                <div className="space-y-0">
                  {tenant.communicationLogs
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                        new Date(a.date).getTime()
                    )
                    .map((log) => (
                      <CommunicationLogEntry key={log.id} log={log} />
                    ))}
                </div>
              ) : (
                <Card>
                  <EmptyState
                    icon={MessageSquare}
                    title="No communication logs"
                    description="Record calls, texts, emails, and in-person conversations with this tenant."
                    action={
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => setAddLogOpen(true)}
                      >
                        Add Entry
                      </Button>
                    }
                  />
                </Card>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <EmptyState
              icon={FileText}
              title="Document management coming soon"
              description="Leases, receipts, and other documents will be stored here."
            />
          )}

          {/* Payment History Tab */}
          {activeTab === "payments" && (
            <EmptyState
              icon={CreditCard}
              title="Payment tracking coming soon"
              description="Payment history and rent tracking will appear here."
            />
          )}
        </div>
      </div>

      {/* Add Communication Log Modal */}
      <AddCommunicationLogModal
        isOpen={addLogOpen}
        onClose={() => setAddLogOpen(false)}
        tenantId={tenantId}
        onSuccess={() => {
          toast({
            type: "success",
            title: "Communication log added",
          });
          fetchTenant();
        }}
      />
    </div>
  );
}
