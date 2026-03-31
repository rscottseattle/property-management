import { Home, Users, DollarSign, Wrench, Plus } from "lucide-react";
import Link from "next/link";

const stats = [
  {
    label: "Total Properties",
    value: "0",
    icon: Home,
    color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  },
  {
    label: "Occupied Units",
    value: "0",
    icon: Users,
    color: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
  },
  {
    label: "Monthly Income",
    value: "$0",
    icon: DollarSign,
    color:
      "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
  },
  {
    label: "Open Requests",
    value: "0",
    icon: Wrench,
    color:
      "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome to Property Manager
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here is an overview of your portfolio.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-semibold text-card-foreground">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Home className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Add your first property to get started
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Once you add a property, you will be able to track units, tenants,
          finances, and maintenance requests all in one place.
        </p>
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Link>
      </div>
    </div>
  );
}
