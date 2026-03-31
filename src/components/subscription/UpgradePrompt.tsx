"use client";

import { useState } from "react";
import { Lock, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface UpgradePromptProps {
  feature: string;
  planRequired: "Pro" | "Pro + STR";
  inline?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function UpgradePrompt({
  feature,
  planRequired,
  inline = true,
  onDismiss,
  className,
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  const content = (
    <div
      className={cn(
        "relative rounded-lg border border-[#b8ccbe] bg-[#e8f0e9] p-4",
        className
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 text-[#5c7c65]/60 hover:text-[#5c7c65] transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d1e0d4]">
          <Lock className="h-5 w-5 text-[#5c7c65]" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-[#2a4a32]">
            Upgrade to {planRequired} to access {feature}
          </p>
          <p className="mt-1 text-sm text-[#3d5e44]">
            Unlock this feature and more with a {planRequired} subscription.
          </p>
          <div className="mt-3">
            <Button
              size="sm"
              href="/pricing"
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!inline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return content;
}
