import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const variantStyles = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-primary/30 shadow-sm",
  secondary:
    "bg-muted text-foreground hover:bg-border focus-visible:ring-primary/20",
  danger:
    "bg-danger text-white hover:opacity-90 focus-visible:ring-danger/30 shadow-sm",
  ghost:
    "bg-transparent text-foreground hover:bg-muted focus-visible:ring-primary/20",
  outline:
    "border border-border bg-white text-foreground hover:bg-muted focus-visible:ring-primary/20 shadow-sm",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      loadingText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      href,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const classes = cn(
      "inline-flex items-center justify-center font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && "w-full",
      className
    );

    if (href && !isDisabled) {
      return (
        <a href={href} className={classes}>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        onClick={onClick}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText ?? "Loading..."}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
