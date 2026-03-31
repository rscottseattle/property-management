import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and application preferences.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-16 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-5">
          <Settings className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Settings coming soon
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Account settings, notification preferences, and more will be available
          here.
        </p>
      </div>
    </div>
  );
}
