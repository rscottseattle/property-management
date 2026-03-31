"use client";

import { Building2, Calendar, DollarSign, Shield, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { LeaseStatusBadge } from "@/components/leases/LeaseStatusBadge";

export interface LeaseData {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRent: number | string;
  securityDeposit?: number | string | null;
  renewalStatus: string;
  terms?: string | null;
  unit: {
    id: string;
    label: string;
    property: {
      id: string;
      name: string;
    };
  };
  tenant: {
    id: string;
    name: string;
  };
}

interface LeaseCardProps {
  lease: LeaseData;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LeaseCard({
  lease,
  compact = false,
  onClick,
  className,
}: LeaseCardProps) {
  const rent = Number(lease.monthlyRent);
  const deposit = lease.securityDeposit ? Number(lease.securityDeposit) : null;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3",
          onClick && "cursor-pointer hover:bg-gray-50 transition-colors",
          className
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {lease.unit.property.name} &mdash; {lease.unit.label}
            </p>
            <LeaseStatusBadge status={lease.renewalStatus} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(lease.startDate)} &mdash; {formatDate(lease.endDate)}
          </p>
        </div>
        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
          {formatCurrency(rent)}/mo
        </p>
      </div>
    );
  }

  return (
    <Card
      padding="md"
      className={cn(
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {lease.unit.property.name} &mdash; {lease.unit.label}
            </h3>
          </div>
          <LeaseStatusBadge status={lease.renewalStatus} />
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{lease.tenant.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{lease.unit.property.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <span>
              {formatDate(lease.startDate)} &mdash; {formatDate(lease.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-900">
              {formatCurrency(rent)}/mo
            </span>
          </div>
          {deposit != null && deposit > 0 && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400 shrink-0" />
              <span>Deposit: {formatCurrency(deposit)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
