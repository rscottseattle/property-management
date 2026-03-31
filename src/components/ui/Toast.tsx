"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

// --- Types ---

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

// --- Context ---

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

// --- Provider ---

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: Omit<Toast, "id">) => {
      const id = `toast-${++counterRef.current}`;
      const newToast: Toast = { id, ...options };
      setToasts((prev) => [...prev, newToast]);

      const duration = options.duration ?? 5000;
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// --- Toast Container ---

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// --- Toast Item ---

const typeConfig = {
  success: {
    icon: CheckCircle2,
    containerClass: "border-[#e8f0e9] bg-card",
    iconClass: "text-success",
  },
  error: {
    icon: AlertCircle,
    containerClass: "border-[#fae8e3] bg-card",
    iconClass: "text-danger",
  },
  info: {
    icon: Info,
    containerClass: "border-[#e5eef5] bg-card",
    iconClass: "text-info",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "border-[#f5eddc] bg-card",
    iconClass: "text-warning",
  },
} as const;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const config = typeConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300",
        config.containerClass,
        mounted
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
