"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, ModalFooter, Button, Input, Select, Textarea } from "@/components/ui";

const communicationLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  method: z.enum(["CALL", "TEXT", "EMAIL", "IN_PERSON", "OTHER"]),
  note: z.string().min(1, "Note is required"),
});

type CommunicationLogFormData = z.infer<typeof communicationLogSchema>;

interface AddCommunicationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

export function AddCommunicationLogModal({
  isOpen,
  onClose,
  tenantId,
  onSuccess,
}: AddCommunicationLogModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommunicationLogFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(communicationLogSchema) as any,
    defaultValues: {
      date: today,
      method: "CALL",
      note: "",
    },
  });

  async function onSubmit(data: CommunicationLogFormData) {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/communication-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to add communication log");
      }

      reset({ date: today, method: "CALL", note: "" });
      onSuccess();
      onClose();
    } catch {
      // Error is handled silently; the modal stays open so user can retry
    }
  }

  function handleClose() {
    reset({ date: today, method: "CALL", note: "" });
    onClose();
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Add Communication Log"
      description="Record a communication with this tenant."
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register("date")}
          />
          <Select
            label="Method"
            options={[
              { value: "CALL", label: "Call" },
              { value: "TEXT", label: "Text" },
              { value: "EMAIL", label: "Email" },
              { value: "IN_PERSON", label: "In-Person" },
              { value: "OTHER", label: "Other" },
            ]}
            error={errors.method?.message}
            {...register("method")}
          />
        </div>

        <Textarea
          label="Note"
          placeholder="What was discussed..."
          rows={4}
          error={errors.note?.message}
          {...register("note")}
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
            Save Entry
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
