"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  INCOME_CATEGORIES,
  SCHEDULE_E_CATEGORIES,
  PAYMENT_METHODS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

// ---------- Schema ----------

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["COMPLETED", "PENDING"]),
  paymentMethod: z.string().optional(),
  payee: z.string().optional(),
  payer: z.string().optional(),
  tenantId: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  recurringEndDate: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

// ---------- Types ----------

interface PropertyOption {
  id: string;
  name: string;
  units: { id: string; label: string }[];
}

interface TenantOption {
  id: string;
  name: string;
}

// ---------- Component ----------

export function NewTransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const defaultType = searchParams.get("type") === "EXPENSE" ? "EXPENSE" : "INCOME";

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [recurringOpen, setRecurringOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: defaultType,
      propertyId: "",
      unitId: "",
      category: "",
      amount: undefined,
      date: today,
      status: "COMPLETED",
      paymentMethod: "",
      payee: "",
      payer: "",
      tenantId: "",
      receiptUrl: "",
      notes: "",
      isRecurring: false,
      recurrenceRule: "monthly",
      recurringEndDate: "",
    },
  });

  const transactionType = watch("type");
  const selectedPropertyId = watch("propertyId");
  const receiptUrl = watch("receiptUrl");
  const isRecurring = watch("isRecurring");

  const isIncome = transactionType === "INCOME";
  const categoryOptions = isIncome ? INCOME_CATEGORIES : SCHEDULE_E_CATEGORIES;
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const units = selectedProperty?.units ?? [];

  // Fetch properties
  useEffect(() => {
    fetch("/api/properties")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Fetch active tenants (for income type)
  useEffect(() => {
    if (isIncome) {
      fetch("/api/tenants?status=ACTIVE")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setTenants(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isIncome]);

  // Reset category when type changes
  useEffect(() => {
    setValue("category", "");
  }, [transactionType, setValue]);

  // Reset unit when property changes
  useEffect(() => {
    setValue("unitId", "");
  }, [selectedPropertyId, setValue]);

  async function onSubmit(data: TransactionFormData) {
    try {
      const body: Record<string, unknown> = { ...data };
      // Clean up optional empty strings
      if (!body.unitId) delete body.unitId;
      if (!body.tenantId) delete body.tenantId;
      if (!body.paymentMethod) delete body.paymentMethod;
      if (!body.payee) delete body.payee;
      if (!body.payer) delete body.payer;
      if (!body.receiptUrl) delete body.receiptUrl;
      if (!body.notes) delete body.notes;
      if (!body.isRecurring) {
        delete body.isRecurring;
        delete body.recurrenceRule;
        delete body.recurringEndDate;
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error ?? "Failed to save transaction");
      }

      toast({
        type: "success",
        title: "Transaction saved",
        description: `${isIncome ? "Payment" : "Expense"} has been recorded.`,
      });
      router.push("/finances");
    } catch (err) {
      toast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  const isImageUrl = (url: string | undefined) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/finances"
          className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Back to finances"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isIncome ? "Record Payment" : "Add Expense"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isIncome
              ? "Record income from rent or other sources."
              : "Track an expense for a property."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Transaction Type */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => setValue("type", "INCOME")}
                className={cn(
                  "px-6 py-2 text-sm font-medium transition-colors",
                  isIncome
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setValue("type", "EXPENSE")}
                className={cn(
                  "px-6 py-2 text-sm font-medium transition-colors border-l border-gray-200",
                  !isIncome
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                Expense
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Property"
                options={[
                  { value: "", label: "Select a property" },
                  ...properties.map((p) => ({ value: p.id, label: p.name })),
                ]}
                error={errors.propertyId?.message}
                {...register("propertyId")}
              />
              {units.length > 0 && (
                <Select
                  label="Unit (optional)"
                  options={[
                    { value: "", label: "No specific unit" },
                    ...units.map((u) => ({ value: u.id, label: u.label })),
                  ]}
                  {...register("unitId")}
                />
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                options={[
                  { value: "", label: "Select a category" },
                  ...categoryOptions.map((c) => ({
                    value: c.value,
                    label: c.label,
                  })),
                ]}
                error={errors.category?.message}
                {...register("category")}
              />
              <Input
                label="Amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                leftAddon="$"
                error={errors.amount?.message}
                {...register("amount")}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Date"
                type="date"
                error={errors.date?.message}
                {...register("date")}
              />
              <Select
                label="Status"
                options={[
                  { value: "COMPLETED", label: "Completed" },
                  { value: "PENDING", label: "Pending" },
                ]}
                error={errors.status?.message}
                {...register("status")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Payment Method"
                options={[
                  { value: "", label: "Select method" },
                  ...PAYMENT_METHODS.map((m) => ({
                    value: m.value,
                    label: m.label,
                  })),
                ]}
                {...register("paymentMethod")}
              />
              <Input
                label={isIncome ? "Payer" : "Payee"}
                placeholder={
                  isIncome
                    ? "Who paid? (e.g., tenant name)"
                    : "Who was paid? (e.g., vendor name)"
                }
                {...register(isIncome ? "payer" : "payee")}
              />
            </div>
            {isIncome && tenants.length > 0 && (
              <Select
                label="Tenant (optional)"
                options={[
                  { value: "", label: "No tenant linked" },
                  ...tenants.map((t) => ({ value: t.id, label: t.name })),
                ]}
                {...register("tenantId")}
              />
            )}
          </CardContent>
        </Card>

        {/* Section 4: Receipt */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Receipt URL"
              type="url"
              placeholder="https://..."
              {...register("receiptUrl")}
            />
            {receiptUrl && isImageUrl(receiptUrl) && (
              <div className="mt-2">
                <img
                  src={receiptUrl}
                  alt="Receipt preview"
                  className="max-h-40 rounded-lg border border-gray-200 object-contain"
                />
              </div>
            )}
            <p className="text-xs text-gray-400">
              File upload coming soon. For now, paste a URL to a receipt image.
            </p>
          </CardContent>
        </Card>

        {/* Section 5: Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional details about this transaction..."
              rows={3}
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Section 6: Recurring (collapsible) */}
        <Card>
          <button
            type="button"
            onClick={() => setRecurringOpen(!recurringOpen)}
            className="flex items-center justify-between w-full px-6 pt-6 pb-2 text-left"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 leading-none">
                Recurring
              </h3>
              <p className="mt-1.5 text-sm text-gray-500">Optional</p>
            </div>
            {recurringOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {recurringOpen && (
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register("isRecurring")}
                />
                <span className="text-sm font-medium text-gray-700">
                  Make this recurring
                </span>
              </label>
              {isRecurring && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="Pattern"
                    options={[
                      { value: "monthly", label: "Monthly" },
                      { value: "quarterly", label: "Quarterly" },
                      { value: "annually", label: "Annually" },
                    ]}
                    {...register("recurrenceRule")}
                  />
                  <Input
                    label="End Date (optional)"
                    type="date"
                    {...register("recurringEndDate")}
                  />
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Form footer */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button variant="outline" href="/finances">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Saving..."
          >
            Save Transaction
          </Button>
        </div>
      </form>
    </div>
  );
}
