"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { MessageSquare, User, Wrench as WrenchIcon } from "lucide-react";
import { Badge } from "@/components/ui";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-[#5c7c65]",
  MEDIUM: "bg-[#c9a96e]",
  HIGH: "bg-[#d4856a]",
  EMERGENCY: "bg-[#c75a3a]",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "info" | "warning" | "success" | "neutral" | "default" }> = {
  SUBMITTED: { label: "Submitted", variant: "info" },
  ACKNOWLEDGED: { label: "Acknowledged", variant: "default" },
  SCHEDULED: { label: "Scheduled", variant: "warning" },
  IN_PROGRESS: { label: "In Progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  EMERGENCY: "Emergency",
};

export interface MaintenanceCardData {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
  property?: { id: string; name: string } | null;
  unit?: { id: string; label: string } | null;
  tenant?: { id: string; name: string } | null;
  vendor?: { id: string; name: string } | null;
  _count?: { notes: number };
}

interface MaintenanceCardProps {
  request: MaintenanceCardData;
  onClick: () => void;
}

export function MaintenanceCard({ request, onClick }: MaintenanceCardProps) {
  const statusConfig = STATUS_CONFIG[request.status] ?? { label: request.status, variant: "neutral" as const };
  const priorityColor = PRIORITY_COLORS[request.priority] ?? "bg-gray-400";
  const noteCount = request._count?.notes ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex items-stretch rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer overflow-hidden"
    >
      {/* Priority color bar */}
      <div className={cn("w-1.5 shrink-0", priorityColor)} />

      {/* Content */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {request.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              {request.property && (
                <span>
                  {request.property.name}
                  {request.unit ? ` — ${request.unit.label}` : ""}
                </span>
              )}
              {request.tenant && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {request.tenant.name}
                </span>
              )}
              {request.vendor && (
                <span className="flex items-center gap-1">
                  <WrenchIcon className="h-3 w-3" />
                  {request.vendor.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <span>{formatDate(request.createdAt)}</span>
          <span className="uppercase font-medium" style={{ color: PRIORITY_COLORS[request.priority]?.replace("bg-", "") }}>
            {PRIORITY_LABEL[request.priority] ?? request.priority}
          </span>
          {noteCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {noteCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
