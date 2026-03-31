import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  default: "bg-primary/10 text-primary border-transparent",
  success: "bg-[#e8f0e9] text-[#3d5e44] border-transparent",
  warning: "bg-[#f5eddc] text-[#8a6d2f] border-transparent",
  danger: "bg-[#fae8e3] text-[#a04025] border-transparent",
  info: "bg-[#e5eef5] text-[#4a6f8a] border-transparent",
  neutral: "bg-muted text-muted-foreground border-transparent",
} as const;

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
} as const;

const dotColors = {
  default: "bg-primary",
  success: "bg-[#5c7c65]",
  warning: "bg-[#c9a96e]",
  danger: "bg-[#c75a3a]",
  info: "bg-[#7b9eb8]",
  neutral: "bg-muted-foreground",
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles;
  size?: "sm" | "md";
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant = "default", size = "md", dot = false, children, ...props },
    ref
  ) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  )
);

Badge.displayName = "Badge";

export { Badge };
