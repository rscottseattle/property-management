import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

export const TIER_LIMITS = {
  FREE: { properties: 3, exportReports: false, strFeatures: false },
  PRO: { properties: Infinity, exportReports: true, strFeatures: false },
  PRO_STR: { properties: Infinity, exportReports: true, strFeatures: true },
} as const;

export async function getUserTier(
  userId: string
): Promise<SubscriptionTier> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  return user.subscriptionTier;
}

export async function checkPropertyLimit(
  userId: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const tier = await getUserTier(userId);
  const limit = TIER_LIMITS[tier].properties;

  const current = await prisma.property.count({
    where: { userId },
  });

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

export async function canAccessSTR(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === "PRO_STR";
}

export async function canExportReports(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === "PRO" || tier === "PRO_STR";
}
