import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  variant?: "text" | "card" | "table" | "avatar";
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

function SkeletonLine({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      style={style}
    />
  );
}

export function LoadingSkeleton({
  variant = "text",
  width,
  height,
  count = 1,
  className,
}: LoadingSkeletonProps) {
  if (variant === "avatar") {
    return (
      <div className={cn("flex gap-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonLine
            key={i}
            className="rounded-full shrink-0"
            style={{
              width: width ?? "40px",
              height: height ?? "40px",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 p-6 space-y-3"
          >
            <SkeletonLine className="h-5 w-2/5" />
            <SkeletonLine className="h-4 w-4/5" />
            <SkeletonLine className="h-4 w-3/5" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Header */}
        <div className="flex gap-4 px-4 py-3">
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-4 w-1/4" />
        </div>
        {/* Rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-t border-gray-100">
            <SkeletonLine className="h-4 w-1/4" />
            <SkeletonLine className="h-4 w-1/4" />
            <SkeletonLine className="h-4 w-1/4" />
            <SkeletonLine className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  // text variant
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine
          key={i}
          style={{
            width: width ?? (i === count - 1 && count > 1 ? "60%" : "100%"),
            height: height ?? "16px",
          }}
        />
      ))}
    </div>
  );
}
