"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  Pencil,
  Trash2,
  Plus,
  DollarSign,
  MessageSquare,
  Calendar,
  User,
  Image as ImageIcon,
  ExternalLink,
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
  Modal,
  ModalFooter,
  Textarea,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusWorkflow } from "@/components/maintenance/StatusWorkflow";
import { AddExpenseModal } from "@/components/maintenance/AddExpenseModal";

// ---------- Types ----------

interface VendorData {
  id: string;
  name: string;
  trade: string;
  phone?: string | null;
  email?: string | null;
}

interface NoteData {
  id: string;
  content: string;
  createdAt: string;
}

interface ExpenseData {
  id: string;
  amount: number | string;
  date: string;
  vendorId?: string | null;
  vendor?: { id: string; name: string } | null;
  receiptUrl?: string | null;
  notes?: string | null;
}

interface MaintenanceRequestData {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  photos: string[];
  estimatedCompletionDate?: string | null;
  completedDate?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  property: { id: string; name: string };
  unit?: { id: string; label: string } | null;
  tenant?: { id: string; name: string; phone?: string | null; email?: string | null } | null;
  vendor?: VendorData | null;
  notes: NoteData[];
  transactions: ExpenseData[];
}

type TabKey = "notes" | "expenses";

// ---------- Helpers ----------

const PRIORITY_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  LOW: { label: "Low", variant: "success" },
  MEDIUM: { label: "Medium", variant: "warning" },
  HIGH: { label: "High", variant: "danger" },
  EMERGENCY: { label: "Emergency", variant: "danger" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "info" | "warning" | "success" | "neutral" | "default" }> = {
  SUBMITTED: { label: "Submitted", variant: "info" },
  ACKNOWLEDGED: { label: "Acknowledged", variant: "default" },
  SCHEDULED: { label: "Scheduled", variant: "warning" },
  IN_PROGRESS: { label: "In Progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
};

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

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const requestId = params.id as string;

  const [request, setRequest] = useState<MaintenanceRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("notes");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/maintenance/${requestId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch request");
      const data = await res.json();
      setRequest(data);
    } catch {
      toast({ type: "error", title: "Failed to load maintenance request" });
    } finally {
      setLoading(false);
    }
  }, [requestId, toast]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  // Fetch vendors for expense modal
  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetch("/api/vendors");
        if (res.ok) {
          const data = await res.json();
          setVendors(data);
        }
      } catch {
        // silent
      }
    }
    fetchVendors();
  }, []);

  // ---------- Handlers ----------

  async function handleStatusChange(newStatus: string) {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/maintenance/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ type: "success", title: `Status updated to ${STATUS_CONFIG[newStatus]?.label ?? newStatus}` });
      fetchRequest();
    } catch {
      toast({ type: "error", title: "Failed to update status" });
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/maintenance/${requestId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete request");
      toast({ type: "success", title: "Maintenance request deleted" });
      router.push("/maintenance");
    } catch {
      toast({ type: "error", title: "Failed to delete request" });
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch(`/api/maintenance/${requestId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      setNoteText("");
      toast({ type: "success", title: "Note added" });
      fetchRequest();
    } catch {
      toast({ type: "error", title: "Failed to add note" });
    } finally {
      setNoteSubmitting(false);
    }
  }

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" count={2} />
        <LoadingSkeleton variant="card" count={1} />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  // ---------- Not found ----------

  if (notFound || !request) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon={Wrench}
          title="Request not found"
          description="The maintenance request you're looking for doesn't exist or has been removed."
          action={
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              href="/maintenance"
            >
              Back to Maintenance
            </Button>
          }
        />
      </div>
    );
  }

  // ---------- Computed ----------

  const priorityConfig = PRIORITY_CONFIG[request.priority] ?? { label: request.priority, variant: "default" as const };
  const statusConfig = STATUS_CONFIG[request.status] ?? { label: request.status, variant: "neutral" as const };
  const sortedNotes = [...request.notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const expenses = request.transactions ?? [];
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          href="/maintenance"
          className="mb-4"
        >
          Maintenance
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {request.title}
              </h1>
              <Badge variant={priorityConfig.variant} size="sm">
                {priorityConfig.label}
              </Badge>
              <Badge variant={statusConfig.variant} size="sm" dot>
                {statusConfig.label}
              </Badge>
            </div>
            {request.description && (
              <p className="mt-2 text-sm text-gray-500">{request.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Pencil className="h-4 w-4" />}
              href={`/maintenance/${requestId}/edit`}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Status workflow */}
      <Card padding="md">
        <StatusWorkflow
          currentStatus={request.status}
          onStatusChange={handleStatusChange}
          loading={statusLoading}
        />
      </Card>

      {/* Info section */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Property
              </p>
              <p className="text-sm font-medium text-gray-900">
                {request.property.name}
                {request.unit ? ` — ${request.unit.label}` : ""}
              </p>
            </div>

            {request.tenant && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Tenant
                </p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-gray-400" />
                  {request.tenant.name}
                </p>
              </div>
            )}

            {request.vendor && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Vendor
                </p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-gray-400" />
                  {request.vendor.name}
                </p>
                {request.vendor.phone && (
                  <p className="text-xs text-gray-500">{request.vendor.phone}</p>
                )}
                {request.vendor.email && (
                  <p className="text-xs text-gray-500">{request.vendor.email}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Created
              </p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDate(request.createdAt)}
              </p>
            </div>

            {request.estimatedCompletionDate && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Est. Completion
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(request.estimatedCompletionDate)}
                </p>
              </div>
            )}

            {request.completedDate && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Completed
                </p>
                <p className="text-sm font-medium text-green-600">
                  {formatDate(request.completedDate)}
                </p>
              </div>
            )}
          </div>

          {/* Photos */}
          {request.photos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Photos
              </p>
              <div className="flex flex-wrap gap-3">
                {request.photos.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group rounded-lg overflow-hidden border border-gray-200 h-20 w-20 bg-gray-50 flex items-center justify-center hover:border-blue-300 transition-colors"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <ImageIcon className="h-6 w-6 text-gray-300 hidden absolute" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200">
          <TabButton
            label="Notes"
            active={activeTab === "notes"}
            onClick={() => setActiveTab("notes")}
          />
          <TabButton
            label="Expenses"
            active={activeTab === "expenses"}
            onClick={() => setActiveTab("expenses")}
          />
        </div>

        <div className="mt-6">
          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Add note form */}
              <Card padding="md">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a note or update..."
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      loading={noteSubmitting}
                      loadingText="Adding..."
                      disabled={!noteText.trim()}
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Notes timeline */}
              {sortedNotes.length > 0 ? (
                <div className="space-y-0">
                  {sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(note.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <EmptyState
                    icon={MessageSquare}
                    title="No notes yet"
                    description="Add a note to track progress on this request."
                  />
                </Card>
              )}
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === "expenses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Linked Expenses
                </h3>
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setExpenseModalOpen(true)}
                >
                  Add Expense
                </Button>
              </div>

              {expenses.length > 0 ? (
                <>
                  <Card>
                    <div className="divide-y divide-gray-100">
                      {expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0">
                              <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(Number(expense.amount))}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{formatDate(expense.date)}</span>
                                {expense.vendor && (
                                  <span>
                                    {expense.vendor.name}
                                  </span>
                                )}
                              </div>
                              {expense.notes && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate">
                                  {expense.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {expense.receiptUrl && (
                              <a
                                href={expense.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                title="View receipt"
                              >
                                <Receipt className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Total */}
                  <Card padding="md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        Total Expenses
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(totalExpense)}
                      </span>
                    </div>
                  </Card>
                </>
              ) : (
                <Card>
                  <EmptyState
                    icon={DollarSign}
                    title="No expenses"
                    description="Track costs associated with this maintenance request."
                    action={
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => setExpenseModalOpen(true)}
                      >
                        Add Expense
                      </Button>
                    }
                  />
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Maintenance Request"
        description="Are you sure you want to delete this request? This action cannot be undone."
        size="sm"
      >
        <ModalFooter className="-mx-6 -mb-4 mt-2">
          <Button
            variant="ghost"
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteLoading}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        requestId={requestId}
        onSuccess={() => {
          toast({ type: "success", title: "Expense added" });
          fetchRequest();
        }}
        vendors={vendors}
      />
    </div>
  );
}
