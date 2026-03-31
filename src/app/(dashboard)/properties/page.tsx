"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Plus, MapPin, Building2, DollarSign } from "lucide-react";
import {
  Button,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface PropertyUnit {
  id: string;
  label: string;
  status: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: "LONG_TERM" | "SHORT_TERM";
  status: "ACTIVE" | "ARCHIVED";
  photos: string[];
  units: PropertyUnit[];
}

function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse">
        <div className="h-40 bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-3/5" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-20" />
            <div className="h-6 bg-gray-200 rounded-full w-16" />
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/properties");
        if (!res.ok) throw new Error("Failed to load properties");
        const data = await res.json();
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const typeBadge = (type: Property["type"]) => {
    if (type === "SHORT_TERM") {
      return (
        <Badge variant="info" size="sm">
          Short-term
        </Badge>
      );
    }
    return (
      <Badge
        variant="info"
        size="sm"
        className="bg-purple-50 text-purple-700 border-purple-200"
      >
        Long-term
      </Badge>
    );
  };

  const statusBadge = (status: Property["status"]) => {
    if (status === "ACTIVE") {
      return (
        <Badge variant="success" size="sm" dot>
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm" dot>
        Archived
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your rental properties and units.
          </p>
        </div>
        <Button
          href="/properties/new"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Property
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card padding="lg">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetch("/api/properties")
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed to load properties");
                    return res.json();
                  })
                  .then(setProperties)
                  .catch((err) =>
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Something went wrong"
                    )
                  )
                  .finally(() => setLoading(false));
              }}
            >
              Try again
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && properties.length === 0 && (
        <Card>
          <EmptyState
            icon={Home}
            title="No properties yet"
            description="Add your first property to start tracking your portfolio."
            action={
              <Button
                href="/properties/new"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Property
              </Button>
            }
          />
        </Card>
      )}

      {/* Property grid */}
      {!loading && !error && properties.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const totalUnits = property.units.length;
            const occupiedUnits = property.units.filter(
              (u) => u.status === "OCCUPIED"
            ).length;
            const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;

            return (
              <Card
                key={property.id}
                hover
                className="overflow-hidden cursor-pointer"
                onClick={() => router.push(`/properties/${property.id}`)}
              >
                {/* Photo placeholder */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {property.photos.length > 0 ? (
                    <img
                      src={property.photos[0]}
                      alt={property.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Home className="h-10 w-10 text-gray-300" />
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {property.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {fullAddress}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeBadge(property.type)}
                    {statusBadge(property.status)}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {totalUnits > 0
                        ? `${occupiedUnits}/${totalUnits} units occupied`
                        : "No units"}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatCurrency(0)}/mo
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
