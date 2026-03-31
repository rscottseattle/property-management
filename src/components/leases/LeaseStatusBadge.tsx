"use client";

import { Badge } from "@/components/ui";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  EXPIRING_SOON: { label: "Expiring Soon", variant: "warning" },
  EXPIRED: { label: "Expired", variant: "danger" },
  MONTH_TO_MONTH: { label: "Month-to-Month", variant: "info" },
  RENEWED: { label: "Renewed", variant: "neutral" },
};

interface LeaseStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function LeaseStatusBadge({ status, size = "sm" }: LeaseStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "neutral" as const,
  };

  return (
    <Badge variant={config.variant} dot size={size}>
      {config.label}
    </Badge>
  );
}
