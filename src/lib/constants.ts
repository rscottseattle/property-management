export const SCHEDULE_E_CATEGORIES = [
  { value: "advertising", label: "Advertising" },
  { value: "auto_and_travel", label: "Auto & Travel" },
  { value: "cleaning_and_maintenance", label: "Cleaning & Maintenance" },
  { value: "commissions", label: "Commissions" },
  { value: "insurance", label: "Insurance" },
  { value: "legal_and_professional", label: "Legal & Professional Fees" },
  { value: "management_fees", label: "Management Fees" },
  { value: "mortgage_interest", label: "Mortgage Interest" },
  { value: "other_interest", label: "Other Interest" },
  { value: "repairs", label: "Repairs" },
  { value: "supplies", label: "Supplies" },
  { value: "taxes", label: "Taxes" },
  { value: "utilities", label: "Utilities" },
  { value: "depreciation", label: "Depreciation" },
  { value: "other", label: "Other" },
] as const;

export const INCOME_CATEGORIES = [
  { value: "rent", label: "Rent" },
  { value: "late_fee", label: "Late Fee" },
  { value: "pet_fee", label: "Pet Fee" },
  { value: "parking", label: "Parking" },
  { value: "laundry", label: "Laundry" },
  { value: "application_fee", label: "Application Fee" },
  { value: "security_deposit", label: "Security Deposit" },
  { value: "other", label: "Other" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
] as const;

export const PROPERTY_TYPES = [
  { value: "LONG_TERM", label: "Long-Term Rental" },
  { value: "SHORT_TERM", label: "Short-Term Rental" },
] as const;

export const UNIT_STATUSES = [
  { value: "vacant", label: "Vacant", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { value: "occupied", label: "Occupied", color: "text-green-700 bg-green-50 border-green-200" },
  { value: "maintenance", label: "Maintenance", color: "text-orange-700 bg-orange-50 border-orange-200" },
  { value: "listed", label: "Listed", color: "text-blue-700 bg-blue-50 border-blue-200" },
] as const;

export const MAINTENANCE_PRIORITIES = [
  { value: "low", label: "Low", color: "text-slate-700 bg-slate-50 border-slate-200" },
  { value: "medium", label: "Medium", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { value: "high", label: "High", color: "text-orange-700 bg-orange-50 border-orange-200" },
  { value: "urgent", label: "Urgent", color: "text-red-700 bg-red-50 border-red-200" },
] as const;

export const MAINTENANCE_STATUSES = [
  { value: "open", label: "Open", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "in_progress", label: "In Progress", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { value: "completed", label: "Completed", color: "text-green-700 bg-green-50 border-green-200" },
  { value: "cancelled", label: "Cancelled", color: "text-slate-700 bg-slate-50 border-slate-200" },
] as const;

export const BOOKING_PLATFORMS = [
  { value: "airbnb", label: "Airbnb" },
  { value: "vrbo", label: "VRBO" },
  { value: "direct", label: "Direct Booking" },
  { value: "other", label: "Other" },
] as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Properties", href: "/properties", icon: "Building2" },
  { label: "Tenants", href: "/tenants", icon: "Users" },
  { label: "Leases", href: "/leases", icon: "FileText" },
  { label: "Transactions", href: "/transactions", icon: "DollarSign" },
  { label: "Maintenance", href: "/maintenance", icon: "Wrench" },
  { label: "Reports", href: "/reports", icon: "BarChart3" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;
