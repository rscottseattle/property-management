"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null | undefined;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  value,
  onChange,
  size = "md",
  className,
}: StarRatingProps) {
  const interactive = !!onChange;
  const rating = value ?? 0;
  const iconSize = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none focus:ring-2 focus:ring-[#5c7c65]/30 rounded-sm transition-colors"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                iconSize,
                filled
                  ? "text-[#c9a96e] fill-[#c9a96e]"
                  : "text-[#d4d4d4] hover:text-[#c9a96e]/60"
              )}
            />
          </button>
        ) : (
          <Star
            key={star}
            className={cn(
              iconSize,
              filled
                ? "text-[#c9a96e] fill-[#c9a96e]"
                : "text-[#d4d4d4]"
            )}
          />
        );
      })}
    </div>
  );
}
