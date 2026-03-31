import Link from "next/link";
import { Building2 } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-slate-900">
              Property Manager
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Pricing
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-slate-400">
              &copy; 2026 Property Manager
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
