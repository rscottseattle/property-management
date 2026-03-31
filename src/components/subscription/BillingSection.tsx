"use client";

import { useState, useEffect } from "react";
import { CreditCard, Crown, ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";
import { PricingCard } from "./PricingCard";

interface SubscriptionInfo {
  tier: "FREE" | "PRO" | "PRO_STR";
  status?: "active" | "trialing" | "cancelled" | "past_due";
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

const tierLabels: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  PRO_STR: "Pro + STR",
};

const statusVariants: Record<string, "success" | "info" | "warning" | "danger"> = {
  active: "success",
  trialing: "info",
  cancelled: "warning",
  past_due: "danger",
};

export function BillingSection() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((res) => res.json())
      .then((data) => {
        setSubscription({
          tier: data.subscriptionTier || "FREE",
          status: data.stripeSubscriptionId ? "active" : undefined,
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
        });
      })
      .catch(() => {
        setSubscription({ tier: "FREE" });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout(priceId: string) {
    setCheckoutLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      // Stripe not configured - silently fail
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to open billing portal");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      // Stripe not configured
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-72 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const tier = subscription?.tier || "FREE";
  const status = subscription?.status;
  const isPaid = tier !== "FREE";

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Crown className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are on the{" "}
                <span className="font-medium text-foreground">
                  {tierLabels[tier]}
                </span>{" "}
                plan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold text-foreground">
              {tierLabels[tier]}
            </span>
            {status && (
              <Badge variant={statusVariants[status] || "default"} dot>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            )}
            {!isPaid && (
              <Badge variant="neutral">Free</Badge>
            )}
          </div>

          {isPaid && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Payment Method</span>
                </div>
                <span className="text-sm text-gray-500">Managed through Stripe</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <span className="text-sm text-gray-700">Next billing date</span>
                <span className="text-sm text-gray-500">See Stripe dashboard</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handlePortal}
                  loading={portalLoading}
                  loadingText="Opening..."
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                >
                  Manage Subscription
                </Button>
                <Button
                  variant="ghost"
                  onClick={handlePortal}
                  leftIcon={<CreditCard className="h-4 w-4" />}
                >
                  View Billing History
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Cards (show for Free users) */}
      {!isPaid && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Upgrade Your Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PricingCard
              name="Pro"
              price={12}
              period="month"
              features={[
                "Unlimited properties",
                "Advanced reporting & analytics",
                "Schedule E tax reports",
                "CSV & PDF export",
                "Document storage",
                "Priority support",
              ]}
              buttonText="Start Free Trial"
              isPopular
              isLoading={checkoutLoading === "pro"}
              onButtonClick={() => handleCheckout("pro")}
              disabled={!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
            />
            <PricingCard
              name="Pro + STR"
              price={18}
              period="month"
              features={[
                "Everything in Pro",
                "Booking management & calendar",
                "Guest management",
                "Cleaning task management",
                "Channel sync (iCal)",
                "STR analytics (ADR, RevPAN, occupancy)",
              ]}
              buttonText="Start Free Trial"
              isLoading={checkoutLoading === "pro_str"}
              onButtonClick={() => handleCheckout("pro_str")}
              disabled={!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
            />
          </div>
        </div>
      )}
    </div>
  );
}
