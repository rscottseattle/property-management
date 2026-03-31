import { DollarSign } from "lucide-react";

export default function FinancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Finances</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track income, expenses, and financial performance.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-16 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-5">
          <DollarSign className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          No financial data yet
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Financial records will appear here once you add properties and tenants.
        </p>
      </div>
    </div>
  );
}
