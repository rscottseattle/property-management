"use client";

import { Menu, Plus, ChevronDown } from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";

interface TopBarProps {
  onMenuToggle: () => void;
  pageTitle?: string;
}

export default function TopBar({ onMenuToggle, pageTitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 sm:px-6 bg-white border-b border-[#ebebeb]">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 mr-2 text-[#6b6b6b] hover:text-[#1a1a1a] rounded-xl hover:bg-[#f5f5f2] transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      {pageTitle && (
        <h1 className="text-lg font-semibold text-[#1a1a1a]">{pageTitle}</h1>
      )}

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Quick add */}
        <button className="flex items-center justify-center h-9 w-9 rounded-full bg-[#e8e9e4] text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#e0e1dc] transition-colors">
          <Plus className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User avatar dropdown */}
        <button className="flex items-center gap-2 ml-1 sm:ml-2 p-1.5 rounded-xl hover:bg-[#f5f5f2] transition-colors">
          <div className="h-8 w-8 rounded-full bg-[#e8f0e9] flex items-center justify-center">
            <span className="text-sm font-medium text-[#3d5e44]">U</span>
          </div>
          <ChevronDown className="hidden sm:block h-4 w-4 text-[#6b6b6b]" />
        </button>
      </div>
    </header>
  );
}
