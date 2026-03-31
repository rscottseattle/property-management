"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Modal, ModalFooter } from "@/components/ui";
import { useToast } from "@/components/ui";

interface ApplyLateFeeButtonProps {
  month: string;
  propertyId?: string;
  onSuccess: () => void;
}

export function ApplyLateFeeButton({
  month,
  propertyId,
  onSuccess,
}: ApplyLateFeeButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  async function handleApply() {
    setApplying(true);
    try {
      const res = await fetch("/api/rent-roll/late-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, propertyId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to apply late fees");
      }

      const data = await res.json();
      const count = data.count ?? 0;

      toast({
        type: "success",
        title: "Late fees applied",
        description: `${count} late fee${count === 1 ? "" : "s"} applied successfully.`,
      });

      setShowConfirm(false);
      onSuccess();
    } catch (err) {
      toast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to apply late fees",
      });
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<AlertTriangle className="h-4 w-4" />}
        className="border-orange-300 text-orange-700 hover:bg-orange-50"
        onClick={() => setShowConfirm(true)}
      >
        Apply Late Fees
      </Button>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Apply Late Fees"
        description="This will apply late fees to all unpaid rent entries that are past their due date for the selected month. This action cannot be undone."
        size="sm"
      >
        <ModalFooter className="px-0 border-t-0">
          <Button
            variant="outline"
            onClick={() => setShowConfirm(false)}
            disabled={applying}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleApply}
            loading={applying}
            loadingText="Applying..."
          >
            Apply Late Fees
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
