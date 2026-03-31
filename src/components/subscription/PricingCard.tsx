"use client";

import { Check, Star } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface PricingCardProps {
  name: string;
  price: number;
  period: string;
  description?: string;
  features: string[];
  buttonText: string;
  buttonVariant?: "primary" | "secondary" | "outline";
  onButtonClick?: () => void;
  buttonHref?: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant = "primary",
  onButtonClick,
  buttonHref,
  isPopular = false,
  isCurrentPlan = false,
  isLoading = false,
  disabled = false,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPopular && "border-blue-500 border-2 shadow-lg shadow-blue-100"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            <Star className="h-3 w-3 fill-current" />
            Most Popular
          </span>
        </div>
      )}

      <CardContent className="flex flex-1 flex-col p-6 pt-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{name}</h3>
            {isCurrentPlan && (
              <Badge variant="info" size="sm">
                Current Plan
              </Badge>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="mb-6">
          <span className="text-4xl font-bold text-foreground">
            ${price}
          </span>
          <span className="text-muted-foreground">/{period}</span>
        </div>

        <ul className="mb-8 flex-1 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          variant={buttonVariant}
          fullWidth
          onClick={onButtonClick}
          href={buttonHref}
          loading={isLoading}
          loadingText="Redirecting..."
          disabled={disabled || isCurrentPlan}
        >
          {isCurrentPlan ? "Current Plan" : buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
