import { Building2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f3f4f0] via-[#eef0eb] to-[#f3f4f0] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-[#5c7c65]" />
          <span className="text-2xl font-bold text-[#1a1a1a]">
            Property Manager
          </span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0e1dc]/50 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
