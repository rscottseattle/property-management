"use client";

import { AlertTriangle } from "lucide-react";
import { Modal, ModalFooter, Button } from "@/components/ui";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className="mb-4 rounded-full bg-red-50 p-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-xs">{message}</p>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          loading={isLoading}
          loadingText="Deleting..."
        >
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}
