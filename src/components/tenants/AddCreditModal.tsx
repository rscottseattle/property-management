"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";

const creditSchema = z.object({
  creditType: z.enum(["CREDIT", "ADJUSTMENT"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
});

type CreditFormData = z.infer<typeof creditSchema>;

interface AddCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  onSuccess: () => void;
}

export function AddCreditModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  onSuccess,
}: AddCreditModalProps) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const [propertyId, setPropertyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreditFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(creditSchema) as any,
    defaultValues: {
      creditType: "CREDIT",
      amount: undefined,
      date: today,
      description: "",
    },
  });

  // Fetch tenant info to get propertyId
  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/tenants/${tenantId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.unit?.property?.id) {
          setPropertyId(data.unit.property.id);
        }
      })
      .catch(() => {});
  }, [isOpen, tenantId]);

  async function onSubmit(data: CreditFormData) {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INCOME",
          category: "credit",
          amount: -data.amount, // negative to reduce balance
          tenantId,
          propertyId: propertyId ?? undefined,
          date: data.date,
          notes: `[${data.creditType}] ${data.description}`,
          status: "COMPLETED",
        }),
      });

      if (!res.ok) throw new Error("Failed to create credit");

      toast({ type: "success", title: "Credit added successfully" });
      reset({ creditType: "CREDIT", amount: undefined, date: today, description: "" });
      onSuccess();
      onClose();
    } catch {
      toast({ type: "error", title: "Failed to add credit" });
    }
  }

  function handleClose() {
    reset({ creditType: "CREDIT", amount: undefined, date: today, description: "" });
    onClose();
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Add Credit / Adjustment"
      description={`Apply a credit or adjustment to ${tenantName}'s ledger.`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            options={[
              { value: "CREDIT", label: "Credit" },
              { value: "ADJUSTMENT", label: "Adjustment" },
            ]}
            error={errors.creditType?.message}
            {...register("creditType")}
          />
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register("amount")}
          />
        </div>

        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register("date")}
        />

        <Textarea
          label="Description / Reason"
          placeholder="e.g., Repair credit, Move-out proration, Goodwill credit"
          rows={3}
          error={errors.description?.message}
          {...register("description")}
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
            Add Credit
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
