"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, ModalFooter, Button, Input, Select, Textarea } from "@/components/ui";

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  vendorId: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface VendorOption {
  id: string;
  name: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  onSuccess: () => void;
  vendors: VendorOption[];
}

export function AddExpenseModal({
  isOpen,
  onClose,
  requestId,
  onSuccess,
  vendors,
}: AddExpenseModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      amount: undefined,
      date: today,
      vendorId: "",
      receiptUrl: "",
      notes: "",
    },
  });

  async function onSubmit(data: ExpenseFormData) {
    try {
      const res = await fetch(`/api/maintenance/${requestId}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to add expense");
      }

      reset({ amount: undefined, date: today, vendorId: "", receiptUrl: "", notes: "" });
      onSuccess();
      onClose();
    } catch {
      // Error handled silently; modal stays open for retry
    }
  }

  function handleClose() {
    reset({ amount: undefined, date: today, vendorId: "", receiptUrl: "", notes: "" });
    onClose();
  }

  const vendorOptions = [
    { value: "", label: "No vendor" },
    ...vendors.map((v) => ({ value: v.id, label: v.name })),
  ];

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Add Expense"
      description="Link an expense to this maintenance request."
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            leftAddon="$"
            error={errors.amount?.message}
            {...register("amount")}
          />
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register("date")}
          />
        </div>

        <Select
          label="Vendor"
          options={vendorOptions}
          error={errors.vendorId?.message}
          {...register("vendorId")}
        />

        <Input
          label="Receipt URL"
          type="url"
          placeholder="https://..."
          error={errors.receiptUrl?.message}
          {...register("receiptUrl")}
        />

        <Textarea
          label="Notes"
          placeholder="Additional details about this expense..."
          rows={3}
          error={errors.notes?.message}
          {...register("notes")}
        />

        <ModalFooter className="-mx-6 -mb-4 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Saving..."
          >
            Add Expense
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
