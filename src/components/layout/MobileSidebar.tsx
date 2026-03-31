"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, X, LogOut } from "lucide-react";
import { navItems } from "./Sidebar";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white rounded-r-2xl border-r border-[#ebebeb] transform transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-[#5c7c65]" />
            <span className="text-lg font-semibold text-[#1a1a1a]">
              Property Manager
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6b6b6b] hover:text-[#1a1a1a] rounded-xl hover:bg-[#f5f5f2] transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
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
                onClick={onClose}
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
      </div>
    </>
  );
}
