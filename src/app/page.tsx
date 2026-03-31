import Link from "next/link";
import {
  Building2,
  Home,
  DollarSign,
  Wrench,
  Users,
  BarChart3,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    title: "Tenant & Lease Management",
    description:
      "Track tenants, leases, and communication history. Get alerts when leases are expiring.",
    icon: Users,
  },
  {
    title: "Rent Collection",
    description:
      "Monthly rent roll, payment tracking, late fee automation, and tenant ledger with running balances.",
    icon: DollarSign,
  },
  {
    title: "Financial Tracking",
    description:
      "Income and expense tracking aligned with IRS Schedule E categories. Tax-ready reports at the click of a button.",
    icon: BarChart3,
  },
  {
    title: "Maintenance Management",
    description:
      "Track maintenance requests from submission to completion. Manage vendors and link expenses to work orders.",
    icon: Wrench,
  },
  {
    title: "Short-Term Rentals",
    description:
      "Booking calendar, guest management, cleaning tasks, and STR analytics — ADR, occupancy, RevPAN.",
    icon: Calendar,
  },
  {
    title: "Reports & Analytics",
    description:
      "Portfolio dashboard, cash flow reports, property comparison, mileage log, and CSV export.",
    icon: FileSpreadsheet,
  },
];

const steps = [
  {
    number: "1",
    title: "Add your properties",
    description:
      "Enter your rental properties with addresses, units, and financial details.",
  },
  {
    number: "2",
    title: "Set up tenants & leases",
    description:
      "Add tenants, create leases, and start tracking rent payments.",
  },
  {
    number: "3",
    title: "Manage everything in one place",
    description:
      "Track finances, handle maintenance, generate tax reports, and grow your portfolio.",
  },
];

const plans = [
  { name: "Free", price: "$0", period: "/mo", note: "Up to 3 properties" },
  { name: "Pro", price: "$12", period: "/mo", note: "Unlimited properties" },
  {
    name: "Pro + STR",
    price: "$18",
    period: "/mo",
    note: "Short-term rentals",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">
                Property Manager
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            {/* Subtle icon pattern */}
            <div className="mb-8 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Property Management
              <br />
              Made Simple
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
              Track tenants, collect rent, manage maintenance, and run your
              rental business — without the complexity of enterprise software.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                See Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                Built for landlords managing 1-10 properties
              </span>
            </div>
            <div className="hidden h-4 w-px bg-slate-300 sm:block" />
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                Long-term & short-term rentals
              </span>
            </div>
            <div className="hidden h-4 w-px bg-slate-300 sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                Free plan — no credit card required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to manage your rentals
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              One app for tenants, rent, maintenance, finances, and reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start free and upgrade as your portfolio grows.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.name}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{plan.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              See full pricing details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to simplify your rental management?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Join landlords who manage their properties without the overhead of
            enterprise software.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            No credit card required. Free plan includes up to 3 properties.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-900">
                Property Manager
              </span>
            </div>
            <div className="flex items-center gap-6">
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
          </div>
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              &copy; 2026 Property Manager. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Built for small landlords, by people who understand rentals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
