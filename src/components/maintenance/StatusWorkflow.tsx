"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";

const STEPS = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

interface StatusWorkflowProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  loading?: boolean;
}

export function StatusWorkflow({
  currentStatus,
  onStatusChange,
  loading = false,
}: StatusWorkflowProps) {
  const currentIndex = STEPS.findIndex((s) => s.value === currentStatus);
  const nextStep = currentIndex >= 0 && currentIndex < STEPS.length - 1
    ? STEPS[currentIndex + 1]
    : null;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={step.value} className="flex items-center flex-1 last:flex-initial">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                    isPast && "bg-[#5c7c65] border-[#5c7c65] text-white",
                    isCurrent && "bg-[#7b9eb8] border-[#7b9eb8] text-white",
                    isFuture && "bg-white border-gray-300 text-gray-400"
                  )}
                >
                  {isPast ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium text-center whitespace-nowrap",
                    isPast && "text-[#5c7c65]",
                    isCurrent && "text-[#7b9eb8]",
                    isFuture && "text-gray-400"
                  )}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.label.split(" ")[0]}</span>
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 mt-[-1.25rem]",
                    index < currentIndex ? "bg-[#5c7c65]" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Next status button */}
      {nextStep && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => onStatusChange(nextStep.value)}
            loading={loading}
            loadingText="Updating..."
          >
            Mark as {nextStep.label}
          </Button>
        </div>
      )}
    </div>
  );
}
