import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View financial reports and portfolio analytics.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-16 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-5">
          <BarChart3 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          No reports available
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Reports will be generated once you have properties and financial data.
        </p>
      </div>
    </div>
  );
}
