"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, ModalFooter, Button, Input, Select } from "@/components/ui";
import { useToast } from "@/components/ui";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const markPaidSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

type MarkPaidFormData = z.infer<typeof markPaidSchema>;

export interface MarkPaidEntryData {
  unitId: string;
  tenantId: string;
  propertyId: string;
  leaseId: string;
  monthlyRent: number;
  amountDue: number;
  tenantName: string;
}

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry: MarkPaidEntryData;
}

export function MarkPaidModal({
  isOpen,
  onClose,
  onSuccess,
  entry,
}: MarkPaidModalProps) {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MarkPaidFormData>({
    resolver: zodResolver(markPaidSchema) as any,
    defaultValues: {
      amount: entry.amountDue,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "",
    },
  });

  async function onSubmit(data: MarkPaidFormData) {
    try {
      const res = await fetch("/api/rent-roll/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: entry.unitId,
          tenantId: entry.tenantId,
          propertyId: entry.propertyId,
          leaseId: entry.leaseId,
          amount: data.amount,
          date: data.date,
          paymentMethod: data.paymentMethod,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to record payment");
      }

      toast({
        type: "success",
        title: "Payment recorded",
        description: `${formatCurrency(data.amount)} from ${entry.tenantName}`,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err) {
      toast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to record payment",
      });
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Record Payment"
      description={`${entry.tenantName} — ${formatCurrency(entry.amountDue)} due`}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          error={errors.amount?.message}
          {...register("amount")}
        />
        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register("date")}
        />
        <Select
          label="Payment Method"
          error={errors.paymentMethod?.message}
          options={[
            { value: "", label: "Select method..." },
            ...PAYMENT_METHODS.map((m) => ({
              value: m.value,
              label: m.label,
            })),
          ]}
          {...register("paymentMethod")}
        />

        <ModalFooter className="px-0 border-t-0">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Recording..."
          >
            Record Payment
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
