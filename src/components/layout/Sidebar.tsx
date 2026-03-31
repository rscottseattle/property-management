"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  DollarSign,
  Receipt,
  Calendar,
  UserCircle,
  Wrench,
  HardHat,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", href: "/properties", icon: Home },
  { label: "Tenants", href: "/tenants", icon: Users },
  { label: "Finances", href: "/finances", icon: DollarSign },
  { label: "Rent Roll", href: "/finances/rent-roll", icon: Receipt },
  { label: "Bookings", href: "/bookings", icon: Calendar },
  { label: "Guests", href: "/guests", icon: UserCircle },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Vendors", href: "/vendors", icon: HardHat },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-[#ebebeb]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 h-16">
        <Building2 className="h-7 w-7 text-[#5c7c65]" />
        <span className="text-lg font-semibold text-[#1a1a1a]">
          Property Manager
        </span>
      </div>
      <div className="mx-4 border-b border-[#ebebeb]" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#e8f0e9] text-[#3d5e44]"
                  : "text-[#6b6b6b] hover:bg-[#f5f5f2] hover:text-[#1a1a1a]"
              }`}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-[#ebebeb] p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#e8f0e9] flex items-center justify-center">
            <span className="text-sm font-medium text-[#3d5e44]">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1a1a] truncate">
              User Name
            </p>
            <p className="text-xs text-[#6b6b6b] truncate">
              user@example.com
            </p>
          </div>
        </div>
        <button className="mt-3 flex items-center gap-2 w-full px-3 py-2 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#f5f5f2] rounded-xl transition-colors">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export { navItems };
