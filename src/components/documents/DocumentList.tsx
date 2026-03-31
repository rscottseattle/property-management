"use client";

import { FileText, Image, File, Download, Trash2 } from "lucide-react";
import { Badge, Button, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export interface DocumentData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  label?: string | null;
  uploadDate: string;
}

interface DocumentListProps {
  documents: DocumentData[];
  onDelete?: (doc: DocumentData) => void;
  emptyMessage?: string;
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "pdf":
      return FileText;
    case "image":
      return Image;
    default:
      return File;
  }
}

const LABEL_VARIANTS: Record<string, "info" | "success" | "warning" | "danger" | "neutral" | "default"> = {
  lease: "info",
  id: "neutral",
  inspection: "warning",
  insurance: "success",
  tax: "danger",
  other: "default",
};

export function DocumentList({
  documents,
  onDelete,
  emptyMessage = "No documents yet",
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={emptyMessage}
        description="Upload documents to keep everything organized."
      />
    );
  }

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
      {documents.map((doc) => {
        const Icon = getFileIcon(doc.fileType);
        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div className="rounded-lg bg-gray-100 p-2 shrink-0">
              <Icon className="h-4 w-4 text-gray-500" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {doc.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(doc.uploadDate)}
              </p>
            </div>

            {doc.label && (
              <Badge
                variant={LABEL_VARIANTS[doc.label] ?? "default"}
                size="sm"
              >
                {doc.label.charAt(0).toUpperCase() + doc.label.slice(1)}
              </Badge>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Download ${doc.fileName}`}
                className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <Download className="h-4 w-4" />
              </a>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(doc)}
                  aria-label={`Delete ${doc.fileName}`}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
