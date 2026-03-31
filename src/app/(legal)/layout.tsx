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
      <header className="border-b border-[#e0e1dc]">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#5c7c65]" />
            <span className="text-lg font-bold text-[#1a1a1a]">
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
      <footer className="border-t border-[#e0e1dc]">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-[#6b6b6b] hover:text-[#4a4a4a]"
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-[#6b6b6b] hover:text-[#4a4a4a]"
              >
                Pricing
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-[#6b6b6b] hover:text-[#4a4a4a]"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-[#6b6b6b] hover:text-[#4a4a4a]"
              >
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-[#9a9a9a]">
              &copy; 2026 Property Manager
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
