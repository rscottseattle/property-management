import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function hasDuplicateNotification(
  userId: string,
  type: string,
  link: string
): Promise<boolean> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      link,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  return !!existing;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  let rentChargesGenerated = 0;
  let expiringLeasesFound = 0;
  let vacantUnitsFound = 0;
  let lateFeesApplied = 0;

  // ── Auto-generate rent charges ──────────────────────────────────────────
  const activeLeases = await prisma.lease.findMany({
    where: {
      renewalStatus: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
      unit: {
        property: { userId },
      },
    },
    include: {
      unit: {
        include: { property: true },
      },
      tenant: true,
    },
  });

  for (const lease of activeLeases) {
    // Check if rent charge already exists for this month
    const existingCharge = await prisma.transaction.findFirst({
      where: {
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        type: "INCOME",
        category: "rent",
        status: "PENDING",
        date: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    });

    if (!existingCharge) {
      const link = `/properties/${lease.unit.propertyId}/units/${lease.unitId}`;
      const notifType = "rent_charge";

      if (await hasDuplicateNotification(userId, notifType, link)) continue;

      await prisma.transaction.create({
        data: {
          propertyId: lease.unit.propertyId,
          unitId: lease.unitId,
          tenantId: lease.tenantId,
          type: "INCOME",
          category: "rent",
          amount: lease.monthlyRent,
          date: currentMonthStart,
          status: "PENDING",
          notes: `Auto-generated rent charge for ${now.toLocaleString("default", { month: "long", year: "numeric" })}`,
        },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: notifType,
          title: "Rent Charge Generated",
          message: `Rent charge of $${lease.monthlyRent} generated for ${lease.unit.label} at ${lease.unit.property.name}`,
          link,
        },
      });

      rentChargesGenerated++;
    }
  }

  // ── Auto-flag expiring leases ───────────────────────────────────────────
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const expiringLeases = await prisma.lease.findMany({
    where: {
      renewalStatus: "ACTIVE",
      endDate: { gte: now, lte: ninetyDaysFromNow },
      unit: {
        property: { userId },
      },
    },
    include: {
      unit: { include: { property: true } },
      tenant: true,
    },
  });

  for (const lease of expiringLeases) {
    const link = `/leases/${lease.id}`;
    const notifType = "lease_expiring";

    if (await hasDuplicateNotification(userId, notifType, link)) continue;

    await prisma.lease.update({
      where: { id: lease.id },
      data: { renewalStatus: "EXPIRING_SOON" },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: notifType,
        title: "Lease Expiring Soon",
        message: `Lease for ${lease.tenant.name} at ${lease.unit.property.name} expires on ${lease.endDate.toLocaleDateString()}`,
        link,
      },
    });

    expiringLeasesFound++;
  }

  // ── Auto-flag vacant units ──────────────────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const vacantUnits = await prisma.unit.findMany({
    where: {
      status: "VACANT",
      property: { userId },
    },
    include: {
      property: true,
      tenant: true,
    },
  });

  for (const unit of vacantUnits) {
    // Check if there's a tenant who moved in within the last 30 days
    const recentTenant = await prisma.tenant.findFirst({
      where: {
        unitId: unit.id,
        moveInDate: { gte: thirtyDaysAgo },
      },
    });

    if (recentTenant) continue;

    const link = `/properties/${unit.propertyId}/units/${unit.id}`;
    const notifType = "vacant_unit";

    if (await hasDuplicateNotification(userId, notifType, link)) continue;

    await prisma.notification.create({
      data: {
        userId,
        type: notifType,
        title: "Extended Vacancy",
        message: `${unit.label} at ${unit.property.name} has been vacant for over 30 days`,
        link,
      },
    });

    vacantUnitsFound++;
  }

  // ── Auto-calculate late fees ────────────────────────────────────────────
  const gracePeriodDate = new Date(now.getFullYear(), now.getMonth(), 6); // 5-day grace = due on 1st, late after 5th

  if (now >= gracePeriodDate) {
    const unpaidRent = await prisma.transaction.findMany({
      where: {
        type: "INCOME",
        category: "rent",
        status: "PENDING",
        date: { gte: currentMonthStart, lte: currentMonthEnd },
        property: { userId },
      },
      include: {
        unit: { include: { property: true } },
        tenant: true,
      },
    });

    for (const rent of unpaidRent) {
      if (!rent.unitId || !rent.tenantId) continue;

      // Check if late fee already exists
      const existingLateFee = await prisma.transaction.findFirst({
        where: {
          unitId: rent.unitId,
          tenantId: rent.tenantId,
          type: "INCOME",
          category: "late_fee",
          date: { gte: currentMonthStart, lte: currentMonthEnd },
        },
      });

      if (existingLateFee) continue;

      const link = `/transactions/${rent.id}`;
      const notifType = "late_fee";

      if (await hasDuplicateNotification(userId, notifType, link)) continue;

      await prisma.transaction.create({
        data: {
          propertyId: rent.propertyId,
          unitId: rent.unitId,
          tenantId: rent.tenantId,
          type: "INCOME",
          category: "late_fee",
          amount: 50,
          date: now,
          status: "PENDING",
          notes: `Auto-generated late fee for ${now.toLocaleString("default", { month: "long", year: "numeric" })}`,
        },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: notifType,
          title: "Late Fee Applied",
          message: `Late fee of $50 applied for ${rent.tenant?.name || "tenant"} at ${rent.unit?.property.name || "property"}`,
          link,
        },
      });

      lateFeesApplied++;
    }
  }

  return Response.json({
    rentChargesGenerated,
    expiringLeasesFound,
    vacantUnitsFound,
    lateFeesApplied,
  });
}
