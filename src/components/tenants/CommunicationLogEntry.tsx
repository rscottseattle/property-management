"use client";

import {
  Phone,
  MessageSquare,
  Mail,
  UserCheck,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface CommunicationLogEntryProps {
  log: {
    id: string;
    date: string;
    method: "CALL" | "TEXT" | "EMAIL" | "IN_PERSON" | "OTHER";
    note: string;
    createdAt: string;
  };
}

const METHOD_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "info" | "success" | "warning" | "neutral";
  }
> = {
  CALL: { label: "Call", icon: Phone, variant: "info" },
  TEXT: { label: "Text", icon: MessageSquare, variant: "success" },
  EMAIL: { label: "Email", icon: Mail, variant: "warning" },
  IN_PERSON: { label: "In-Person", icon: UserCheck, variant: "info" },
  OTHER: { label: "Other", icon: MoreHorizontal, variant: "neutral" },
};

export function CommunicationLogEntry({ log }: CommunicationLogEntryProps) {
  const config = METHOD_CONFIG[log.method] ?? METHOD_CONFIG.OTHER;
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div className="flex-1 w-px bg-gray-200 mt-2 last:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={config.variant} size="sm">
            {config.label}
          </Badge>
          <span className="text-xs text-gray-400">
            {formatDate(log.date)}
          </span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.note}</p>
      </div>
    </div>
  );
}
