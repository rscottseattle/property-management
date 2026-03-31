import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex">
          {leftAddon && (
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
              {leftAddon}
            </span>
          )}
          <div className="relative flex-1">
            {leftIcon && (
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                {leftIcon}
              </div>
            )}
            <input
              ref={ref}
              id={inputId}
              disabled={disabled}
              className={cn(
                "block w-full rounded-xl border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-0",
                hasError
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : "border-border focus:border-primary focus:ring-primary/20",
                leftIcon && "pl-10",
                rightIcon && "pr-10",
                leftAddon && "rounded-l-none",
                rightAddon && "rounded-r-none",
                disabled && "cursor-not-allowed bg-muted text-muted-foreground",
                className
              )}
              {...props}
            />
            {rightIcon && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                {rightIcon}
              </div>
            )}
          </div>
          {rightAddon && (
            <span className="inline-flex items-center rounded-r-xl border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
              {rightAddon}
            </span>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
