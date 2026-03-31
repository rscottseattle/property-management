"use client";

import { Bed, Bath, Maximize2, Pencil, Trash2, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { UNIT_STATUSES } from "@/lib/constants";

interface UnitTenant {
  id: string;
  name: string;
}

interface UnitLease {
  id: string;
  monthlyRent: number | string;
  renewalStatus: string;
}

export interface UnitData {
  id: string;
  label: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | string | null;
  squareFootage: number | null;
  tenant: UnitTenant | null;
  leases?: UnitLease[];
}

interface UnitCardProps {
  unit: UnitData;
  onEdit: (unit: UnitData) => void;
  onDelete: (unit: UnitData) => void;
}

function getStatusBadge(status: string) {
  const statusConfig = UNIT_STATUSES.find(
    (s) => s.value === status.toLowerCase()
  );
  const label = statusConfig?.label ?? status;

  const variantMap: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
    occupied: "success",
    vacant: "warning",
    maintenance: "danger",
    listed: "info",
  };

  const variant = variantMap[status.toLowerCase()] ?? "default";

  return (
    <Badge variant={variant} dot size="sm">
      {label}
    </Badge>
  );
}

export function UnitCard({ unit, onEdit, onDelete }: UnitCardProps) {
  const activeLease = unit.leases?.find(
    (l) => l.renewalStatus === "ACTIVE" || l.renewalStatus === "MONTH_TO_MONTH"
  );
  const monthlyRent = activeLease
    ? formatCurrency(Number(activeLease.monthlyRent))
    : null;

  return (
    <Card hover>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {unit.label}
            </h4>
            <div className="mt-1">{getStatusBadge(unit.status)}</div>
          </div>
          {monthlyRent && (
            <span className="text-sm font-semibold text-gray-900">
              {monthlyRent}
              <span className="text-xs font-normal text-gray-500">/mo</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
          <User className="h-3.5 w-3.5 text-gray-400" />
          <span>{unit.tenant?.name ?? "Vacant"}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          {unit.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {unit.bedrooms} bd
            </span>
          )}
          {unit.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {Number(unit.bathrooms)} ba
            </span>
          )}
          {unit.squareFootage != null && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" />
              {unit.squareFootage.toLocaleString()} sqft
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Pencil className="h-3.5 w-3.5" />}
          onClick={() => onEdit(unit)}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#c75a3a] hover:text-[#a04025] hover:bg-[#fae8e3]"
          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={() => onDelete(unit)}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
