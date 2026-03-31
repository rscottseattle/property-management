"use client";

import { Menu, Plus, ChevronDown } from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";

interface TopBarProps {
  onMenuToggle: () => void;
  pageTitle?: string;
}

export default function TopBar({ onMenuToggle, pageTitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 sm:px-6 bg-topbar-bg border-b border-topbar-border">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      {pageTitle && (
        <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      )}

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Quick add */}
        <button className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="h-7 w-7 rounded-full border-2 border-current flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </div>
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User avatar dropdown */}
        <button className="flex items-center gap-2 ml-1 sm:ml-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">U</span>
          </div>
          <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
