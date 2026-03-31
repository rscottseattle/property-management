"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, ModalFooter, Button, Input, Select } from "@/components/ui";

const documentSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File URL is required").url("Must be a valid URL"),
  fileType: z.string().min(1, "File type is required"),
  label: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  leaseId?: string;
}

const fileTypeOptions = [
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
];

const labelOptions = [
  { value: "", label: "None" },
  { value: "lease", label: "Lease" },
  { value: "id", label: "ID" },
  { value: "inspection", label: "Inspection" },
  { value: "insurance", label: "Insurance" },
  { value: "tax", label: "Tax" },
  { value: "other", label: "Other" },
];

export function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  propertyId,
  unitId,
  tenantId,
  leaseId,
}: UploadDocumentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(documentSchema) as any,
    defaultValues: {
      fileName: "",
      fileUrl: "",
      fileType: "pdf",
      label: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        fileName: "",
        fileUrl: "",
        fileType: "pdf",
        label: "",
      });
    }
  }, [isOpen, reset]);

  async function onSubmit(data: DocumentFormValues) {
    const payload = {
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      label: data.label || null,
      propertyId: propertyId || null,
      unitId: unitId || null,
      tenantId: tenantId || null,
      leaseId: leaseId || null,
    };

    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to upload document");
    }

    onSuccess();
    onClose();
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Upload Document"
      description="Add a document record. File upload support is coming soon."
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="File Name"
          placeholder="e.g. Lease Agreement - Unit A"
          error={errors.fileName?.message}
          {...register("fileName")}
        />

        <Input
          label="File URL"
          placeholder="https://example.com/document.pdf"
          error={errors.fileUrl?.message}
          {...register("fileUrl")}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="File Type"
            options={fileTypeOptions}
            error={errors.fileType?.message}
            {...register("fileType")}
          />

          <Select
            label="Label"
            options={labelOptions}
            error={errors.label?.message}
            {...register("label")}
          />
        </div>

        <ModalFooter className="px-0 border-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} loadingText="Saving...">
            Upload Document
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
