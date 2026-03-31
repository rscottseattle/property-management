"use client";

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: keyof typeof sizeStyles;
  closeOnOverlayClick?: boolean;
  children: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  closeOnOverlayClick = true,
  children,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    // Focus trap: focus first focusable element
    const timer = setTimeout(() => {
      const focusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 animate-in fade-in duration-300"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full rounded-2xl border border-border/50 bg-card shadow-xl",
          "animate-in fade-in zoom-in-95 duration-300",
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-2">
            {title && (
              <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ModalFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
