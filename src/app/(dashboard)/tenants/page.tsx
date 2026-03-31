import { Users, Plus } from "lucide-react";

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tenants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your tenants and lease agreements.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Add Tenant
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-16 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-5">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          No tenants yet
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Add properties first, then assign tenants to units.
        </p>
        <button className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Add Tenant
        </button>
      </div>
    </div>
  );
}
