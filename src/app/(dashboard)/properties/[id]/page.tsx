"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Percent,
  Home,
  Pencil,
  Trash2,
  Plus,
  Wrench,
  FileText,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  LoadingSkeleton,
  EmptyState,
  useToast,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { PROPERTY_TYPES } from "@/lib/constants";
import { UnitCard, type UnitData } from "@/components/properties/UnitCard";
import { AddUnitModal } from "@/components/properties/AddUnitModal";
import { DeleteConfirmModal } from "@/components/properties/DeleteConfirmModal";

// ---------- Types ----------

interface PropertyData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  status: string;
  purchasePrice: number | string | null;
  mortgageAmount: number | string | null;
  insuranceCost: number | string | null;
  propertyTax: number | string | null;
  notes: string | null;
  units: UnitData[];
}

type TabKey = "units" | "finances" | "maintenance" | "documents";

// ---------- Helpers ----------

function getPropertyTypeBadge(type: string) {
  const config = PROPERTY_TYPES.find((t) => t.value === type);
  return (
    <Badge variant="info" size="sm">
      {config?.label ?? type}
    </Badge>
  );
}

function getStatusBadge(status: string) {
  const variant = status === "ACTIVE" ? "success" : "neutral";
  return (
    <Badge variant={variant} dot size="sm">
      {status === "ACTIVE" ? "Active" : "Archived"}
    </Badge>
  );
}

// ---------- Stat Card ----------

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-2.5">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ---------- Tab Button ----------

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

// ---------- Main Page ----------

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const propertyId = params.id as string;

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("units");

  // Modal states
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitData | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<UnitData | null>(null);
  const [deletePropertyOpen, setDeletePropertyOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProperty = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch property");
      const data = await res.json();
      setProperty(data);
    } catch {
      toast({ type: "error", title: "Failed to load property" });
    } finally {
      setLoading(false);
    }
  }, [propertyId, toast]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // ---------- Delete property ----------

  async function handleDeleteProperty() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete property");
      toast({ type: "success", title: "Property deleted" });
      router.push("/properties");
    } catch {
      toast({ type: "error", title: "Failed to delete property" });
    } finally {
      setDeleteLoading(false);
      setDeletePropertyOpen(false);
    }
  }

  // ---------- Delete unit ----------

  async function handleDeleteUnit() {
    if (!deletingUnit) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/units/${deletingUnit.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete unit");
      toast({ type: "success", title: "Unit deleted" });
      fetchProperty();
    } catch {
      toast({ type: "error", title: "Failed to delete unit" });
    } finally {
      setDeleteLoading(false);
      setDeletingUnit(null);
    }
  }

  // ---------- Computed stats ----------

  const units = property?.units ?? [];
  const totalUnits = units.length;
  const occupiedUnits = units.filter(
    (u) => u.status.toUpperCase() === "OCCUPIED"
  ).length;
  const monthlyRent = units.reduce((sum, u) => {
    const activeLease = u.leases?.find(
      (l) =>
        l.renewalStatus === "ACTIVE" || l.renewalStatus === "MONTH_TO_MONTH"
    );
    return sum + (activeLease ? Number(activeLease.monthlyRent) : 0);
  }, 0);
  const vacancyRate =
    totalUnits > 0
      ? Math.round(((totalUnits - occupiedUnits) / totalUnits) * 100)
      : 0;

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" count={2} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
        </div>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  // ---------- Not found ----------

  if (notFound || !property) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon={Building2}
          title="Property not found"
          description="The property you're looking for doesn't exist or has been removed."
          action={
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              href="/properties"
            >
              Back to Properties
            </Button>
          }
        />
      </div>
    );
  }

  // ---------- Financial info ----------

  const hasFinancials =
    property.purchasePrice ||
    property.mortgageAmount ||
    property.insuranceCost ||
    property.propertyTax;

  const financialItems = [
    {
      label: "Purchase Price",
      value: property.purchasePrice,
    },
    {
      label: "Mortgage",
      value: property.mortgageAmount,
    },
    {
      label: "Insurance",
      value: property.insuranceCost,
    },
    {
      label: "Property Tax",
      value: property.propertyTax,
    },
  ].filter((item) => item.value != null);

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          href="/properties"
          className="mb-4"
        >
          Properties
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {property.name}
              </h1>
              {getPropertyTypeBadge(property.type)}
              {getStatusBadge(property.status)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>
                {property.address}, {property.city}, {property.state}{" "}
                {property.zipCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Pencil className="h-4 w-4" />}
              href="#"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeletePropertyOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Units" value={totalUnits} icon={Home} />
        <StatCard label="Occupied" value={occupiedUnits} icon={Users} />
        <StatCard
          label="Monthly Rent"
          value={formatCurrency(monthlyRent)}
          icon={DollarSign}
        />
        <StatCard
          label="Vacancy Rate"
          value={`${vacancyRate}%`}
          icon={Percent}
        />
      </div>

      {/* Financial info row */}
      {hasFinancials && (
        <Card padding="sm">
          <div className="flex flex-wrap gap-x-8 gap-y-2 px-2">
            {financialItems.map((item) => (
              <div key={item.label} className="text-sm">
                <span className="text-gray-500">{item.label}: </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(Number(item.value))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <TabButton
            label="Units"
            active={activeTab === "units"}
            onClick={() => setActiveTab("units")}
          />
          <TabButton
            label="Finances"
            active={activeTab === "finances"}
            onClick={() => setActiveTab("finances")}
          />
          <TabButton
            label="Maintenance"
            active={activeTab === "maintenance"}
            onClick={() => setActiveTab("maintenance")}
          />
          <TabButton
            label="Documents"
            active={activeTab === "documents"}
            onClick={() => setActiveTab("documents")}
          />
        </div>

        <div className="mt-6">
          {/* Units Tab */}
          {activeTab === "units" && (
            <div>
              {units.length === 0 ? (
                <EmptyState
                  icon={Home}
                  title="No units yet"
                  description="Add your first unit to start tracking occupancy and rent."
                  action={
                    <Button
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => setAddUnitOpen(true)}
                    >
                      Add Unit
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {units.map((unit) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        onEdit={(u) => {
                          setEditingUnit(u);
                          setAddUnitOpen(true);
                        }}
                        onDelete={(u) => setDeletingUnit(u)}
                      />
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => setAddUnitOpen(true)}
                    >
                      Add Unit
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Finances Tab */}
          {activeTab === "finances" && (
            <EmptyState
              icon={DollarSign}
              title="Financial tracking coming soon"
              description="Income, expenses, and financial reports will appear here."
            />
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <EmptyState
              icon={Wrench}
              title="Maintenance tracking coming soon"
              description="Maintenance requests and work orders will appear here."
            />
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <EmptyState
              icon={FileText}
              title="Document storage coming soon"
              description="Leases, receipts, and other documents will be stored here."
            />
          )}
        </div>
      </div>

      {/* Add/Edit Unit Modal */}
      <AddUnitModal
        isOpen={addUnitOpen}
        onClose={() => {
          setAddUnitOpen(false);
          setEditingUnit(null);
        }}
        propertyId={propertyId}
        unit={editingUnit}
        onSuccess={() => {
          toast({
            type: "success",
            title: editingUnit ? "Unit updated" : "Unit added",
          });
          fetchProperty();
        }}
      />

      {/* Delete Unit Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingUnit}
        onClose={() => setDeletingUnit(null)}
        onConfirm={handleDeleteUnit}
        title="Delete Unit"
        message={`Are you sure you want to delete "${deletingUnit?.label}"? This action cannot be undone.`}
        isLoading={deleteLoading}
      />

      {/* Delete Property Modal */}
      <DeleteConfirmModal
        isOpen={deletePropertyOpen}
        onClose={() => setDeletePropertyOpen(false)}
        onConfirm={handleDeleteProperty}
        title="Delete Property"
        message={`Are you sure you want to delete "${property.name}" and all its units? This action cannot be undone.`}
        isLoading={deleteLoading}
      />
    </div>
  );
}
