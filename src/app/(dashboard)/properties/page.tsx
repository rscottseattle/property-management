import { Home, Plus } from "lucide-react";

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your rental properties and units.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      {/* Empty state */}
      <div className="bg-card border border-border rounded-xl p-16 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-5">
          <Home className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          No properties yet
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Add your first property to start tracking your portfolio.
        </p>
        <button className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>
    </div>
  );
}
