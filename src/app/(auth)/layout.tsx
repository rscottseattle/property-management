import { Building2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-indigo-600" />
          <span className="text-2xl font-bold text-slate-900">
            Property Manager
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
