"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Shield,
  Sliders,
  Bell,
  Database,
  Download,
  Trash2,
  Eye,
  EyeOff,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Modal,
  ModalFooter,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { BillingSection } from "@/components/subscription/BillingSection";

// ─── Schemas ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  phone: z.string().optional(),
  businessName: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Tab Config ─────────────────────────────────────────────────────────────

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data", icon: Database },
] as const;

type TabId = (typeof tabs)[number]["id"];

// ─── Preferences Types ─────────────────────────────────────────────────────

interface Preferences {
  currency: string;
  lateFeeAmount: number;
  gracePeriodDays: number;
  defaultLeaseDuration: string;
}

interface NotificationPrefs {
  rentDueReminders: boolean;
  rentOverdueAlerts: boolean;
  leaseExpirationWarnings: boolean;
  maintenanceStatusChanges: boolean;
  bookingReminders: boolean;
  weeklySummary: boolean;
}

const defaultPreferences: Preferences = {
  currency: "USD",
  lateFeeAmount: 50,
  gracePeriodDays: 5,
  defaultLeaseDuration: "12",
};

const defaultNotifications: NotificationPrefs = {
  rentDueReminders: true,
  rentOverdueAlerts: true,
  leaseExpirationWarnings: true,
  maintenanceStatusChanges: true,
  bookingReminders: true,
  weeklySummary: false,
};

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and application preferences.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Settings tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "billing" && <BillingSection />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "preferences" && <PreferencesTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "data" && <DataTab />}
      </div>
    </div>
  );
}

// ─── Profile Tab ────────────────────────────────────────────────────────────

function ProfileTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as any,
  });

  const name = watch("name");

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((res) => res.json())
      .then((data) => {
        reset({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          businessName: data.businessName || "",
        });
      })
      .catch(() => {
        toast({ type: "error", title: "Failed to load profile" });
      })
      .finally(() => setLoading(false));
  }, [reset, toast]);

  async function onSubmit(data: ProfileForm) {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone || undefined,
          businessName: data.businessName || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update profile");
      }

      const updated = await res.json();
      reset({
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        businessName: updated.businessName || "",
      });
      toast({ type: "success", title: "Profile updated" });
    } catch (err) {
      toast({
        type: "error",
        title: err instanceof Error ? err.message : "Failed to update profile",
      });
    }
  }

  const initials = (name || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 rounded-full bg-gray-200" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal details and business information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Profile Photo
              </p>
              <p className="text-xs text-gray-500">
                Avatar upload coming soon
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              {...register("name")}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              {...register("email")}
              disabled
              helperText="Email cannot be changed"
            />
            <Input
              label="Phone"
              type="tel"
              {...register("phone")}
              error={errors.phone?.message}
            />
            <Input
              label="Business Name"
              {...register("businessName")}
              error={errors.businessName?.message}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Saving..."
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Security Tab ───────────────────────────────────────────────────────────

function SecurityTab() {
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema) as any,
  });

  async function onSubmit(data: PasswordForm) {
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }

      reset();
      toast({ type: "success", title: "Password changed successfully" });
    } catch (err) {
      toast({
        type: "error",
        title:
          err instanceof Error ? err.message : "Failed to change password",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrent ? "text" : "password"}
                {...register("currentPassword")}
                error={errors.currentPassword?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="pointer-events-auto cursor-pointer"
                    tabIndex={-1}
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>
            <div className="relative">
              <Input
                label="New Password"
                type={showNew ? "text" : "password"}
                {...register("newPassword")}
                error={errors.newPassword?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="pointer-events-auto cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>
            <Input
              label="Confirm New Password"
              type="password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                loading={isSubmitting}
                loadingText="Updating..."
              >
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-500">
              Session management coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Preferences Tab ────────────────────────────────────────────────────────

function PreferencesTab() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    const stored = localStorage.getItem("pm-preferences");
    if (stored) {
      try {
        setPrefs({ ...defaultPreferences, ...JSON.parse(stored) });
      } catch {
        // use defaults
      }
    }
  }, []);

  function updatePref<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("pm-preferences", JSON.stringify(next));
      return next;
    });
  }

  function handleSave() {
    localStorage.setItem("pm-preferences", JSON.stringify(prefs));
    toast({ type: "success", title: "Preferences saved" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>
            Customize the appearance of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
          <CardDescription>
            Set default values for common settings across the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Default Currency"
              value={prefs.currency}
              onChange={(e) => updatePref("currency", e.target.value)}
              options={[
                { value: "USD", label: "USD - US Dollar" },
                { value: "EUR", label: "EUR - Euro" },
                { value: "GBP", label: "GBP - British Pound" },
                { value: "CAD", label: "CAD - Canadian Dollar" },
              ]}
            />
            <Select
              label="Default Lease Duration"
              value={prefs.defaultLeaseDuration}
              onChange={(e) =>
                updatePref("defaultLeaseDuration", e.target.value)
              }
              options={[
                { value: "6", label: "6 months" },
                { value: "12", label: "12 months" },
                { value: "24", label: "24 months" },
              ]}
            />
            <Input
              label="Default Late Fee Amount"
              type="number"
              leftAddon="$"
              value={prefs.lateFeeAmount}
              onChange={(e) =>
                updatePref("lateFeeAmount", Number(e.target.value))
              }
            />
            <Input
              label="Grace Period (days)"
              type="number"
              value={prefs.gracePeriodDays}
              onChange={(e) =>
                updatePref("gracePeriodDays", Number(e.target.value))
              }
            />
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={handleSave}>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notifications Tab ──────────────────────────────────────────────────────

function NotificationsTab() {
  const { toast } = useToast();
  const [notifPrefs, setNotifPrefs] =
    useState<NotificationPrefs>(defaultNotifications);

  useEffect(() => {
    const stored = localStorage.getItem("pm-notification-prefs");
    if (stored) {
      try {
        setNotifPrefs({ ...defaultNotifications, ...JSON.parse(stored) });
      } catch {
        // use defaults
      }
    }
  }, []);

  function toggle(key: keyof NotificationPrefs) {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("pm-notification-prefs", JSON.stringify(next));
      return next;
    });
  }

  function handleSave() {
    localStorage.setItem("pm-notification-prefs", JSON.stringify(notifPrefs));
    toast({ type: "success", title: "Notification preferences saved" });
  }

  const notificationOptions: {
    key: keyof NotificationPrefs;
    label: string;
    description: string;
  }[] = [
    {
      key: "rentDueReminders",
      label: "Rent Due Reminders",
      description: "Get notified when rent payments are coming due",
    },
    {
      key: "rentOverdueAlerts",
      label: "Rent Overdue Alerts",
      description: "Get alerted when rent payments are past due",
    },
    {
      key: "leaseExpirationWarnings",
      label: "Lease Expiration Warnings",
      description: "Get warned when leases are nearing expiration",
    },
    {
      key: "maintenanceStatusChanges",
      label: "Maintenance Status Changes",
      description: "Get notified when maintenance request statuses change",
    },
    {
      key: "bookingReminders",
      label: "Booking Reminders",
      description: "Get reminded about upcoming bookings",
    },
    {
      key: "weeklySummary",
      label: "Weekly Summary",
      description: "Receive a weekly summary of your property activity",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notificationOptions.map((opt) => (
            <div
              key={opt.key}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifPrefs[opt.key]}
                onClick={() => toggle(opt.key)}
                className={`
                  relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
                  ${notifPrefs[opt.key] ? "bg-blue-600" : "bg-gray-200"}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform
                    ${notifPrefs[opt.key] ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-6">
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Data Tab ───────────────────────────────────────────────────────────────

function DataTab() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `property-manager-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ type: "success", title: "Data exported successfully" });
    } catch {
      toast({ type: "error", title: "Failed to export data" });
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;

    setDeleting(true);
    try {
      const res = await fetch("/api/settings/profile", { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete account");
      }
      // Redirect to home/login after deletion
      window.location.href = "/login";
    } catch {
      toast({ type: "error", title: "Failed to delete account" });
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download all your data as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This will export all your properties, units, tenants, leases,
            transactions, maintenance requests, vendors, guests, and bookings.
          </p>
          <Button
            onClick={handleExport}
            loading={exporting}
            loadingText="Exporting..."
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export All Data
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Import data from a previously exported file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-500">
              Data import coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirm("");
        }}
        title="Delete Account"
        description="This will permanently delete your account and all associated data. This action cannot be undone."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">
              All properties, tenants, leases, transactions, maintenance
              requests, vendors, guests, and bookings will be permanently
              deleted.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type <span className="font-mono font-bold">DELETE</span> to
              confirm
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirm("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "DELETE"}
            loading={deleting}
            loadingText="Deleting..."
          >
            Delete My Account
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
