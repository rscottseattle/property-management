"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";
import { PricingCard } from "@/components/subscription/PricingCard";

const STRIPE_CONFIGURED = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, cancel from your billing settings. Your subscription will remain active until the end of your current billing period.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes, 14-day free trial on Pro and Pro+STR. No credit card required to start.",
  },
  {
    question: "What happens when I downgrade?",
    answer:
      "Your data is kept, but access to premium features is restricted. You can always upgrade again to regain access.",
  },
  {
    question: "Can I switch plans?",
    answer:
      "Yes, upgrade or downgrade anytime from billing settings. Changes take effect on your next billing cycle.",
  },
];

export default function PricingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleCheckout(priceId: string) {
    if (!STRIPE_CONFIGURED) return;

    setCheckoutLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) throw new Error("Checkout failed");

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      // Stripe not configured or error
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      {/* Header / Branding */}
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-2 mb-12">
          <Building2 className="h-8 w-8 text-[#5c7c65]" />
          <span className="text-2xl font-bold text-[#1a1a1a]">
            Property Manager
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1a1a1a] sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-[#6b6b6b] max-w-2xl mx-auto">
            Start free and upgrade as your portfolio grows. All plans include a
            14-day free trial on paid tiers.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <PricingCard
            name="Free"
            price={0}
            period="month"
            description="For getting started"
            features={[
              "Up to 3 properties",
              "Tenant & lease management",
              "Rent collection & tracking",
              "Maintenance requests",
              "Basic reporting",
            ]}
            buttonText="Get Started"
            buttonVariant="outline"
            buttonHref="/register"
          />

          <PricingCard
            name="Pro"
            price={12}
            period="month"
            description="For growing portfolios"
            features={[
              "Everything in Free, plus:",
              "Unlimited properties",
              "Advanced reporting & analytics",
              "Schedule E tax reports",
              "CSV & PDF export",
              "Document storage",
              "Priority support",
            ]}
            buttonText={STRIPE_CONFIGURED ? "Start Free Trial" : "Coming Soon"}
            isPopular
            isLoading={checkoutLoading === "pro"}
            onButtonClick={() => handleCheckout("pro")}
            disabled={!STRIPE_CONFIGURED}
          />

          <PricingCard
            name="Pro + STR"
            price={18}
            period="month"
            description="For short-term rentals"
            features={[
              "Everything in Pro, plus:",
              "Booking management & calendar",
              "Guest management",
              "Cleaning task management",
              "Channel sync (iCal)",
              "STR analytics (ADR, RevPAN, occupancy)",
            ]}
            buttonText={STRIPE_CONFIGURED ? "Start Free Trial" : "Coming Soon"}
            isLoading={checkoutLoading === "pro_str"}
            onButtonClick={() => handleCheckout("pro_str")}
            disabled={!STRIPE_CONFIGURED}
          />
        </div>

        {/* FAQ Section */}
        <div className="mx-auto max-w-2xl mb-16">
          <h2 className="text-2xl font-bold text-[#1a1a1a] text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-lg border border-[#e0e1dc] bg-white"
              >
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-[#1a1a1a]">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-[#6b6b6b] shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#6b6b6b] shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[#6b6b6b]">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-sm text-[#6b6b6b]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#5c7c65] hover:text-[#3d5e44]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
