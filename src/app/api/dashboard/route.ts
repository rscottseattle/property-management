import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Scope: all properties owned by this user
  const userProperties = await prisma.property.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, name: true },
  });

  const propertyIds = userProperties.map((p) => p.id);
  const propertyNameMap = new Map(userProperties.map((p) => [p.id, p.name]));

  // ─── Portfolio Stats ─────────────────────────────────────────────────────
  const [totalUnits, occupiedUnits, activeLeases] = await Promise.all([
    prisma.unit.count({
      where: { propertyId: { in: propertyIds } },
    }),
    prisma.unit.count({
      where: { propertyId: { in: propertyIds }, status: "OCCUPIED" },
    }),
    prisma.lease.findMany({
      where: {
        unit: { propertyId: { in: propertyIds } },
        renewalStatus: "ACTIVE",
      },
      select: { monthlyRent: true },
    }),
  ]);

  const totalMonthlyRent = activeLeases.reduce(
    (sum, l) => sum + Number(l.monthlyRent),
    0
  );
  const vacancyRate =
    totalUnits > 0
      ? ((totalUnits - occupiedUnits) / totalUnits) * 100
      : 0;

  const portfolioStats = {
    totalProperties: userProperties.length,
    totalUnits,
    occupiedUnits,
    vacancyRate: Math.round(vacancyRate * 10) / 10,
    totalMonthlyRent,
  };

  // ─── Financial Summary ───────────────────────────────────────────────────
  const baseFinanceWhere = {
    propertyId: { in: propertyIds },
    status: "COMPLETED" as const,
  };

  const [
    currentMonthIncome,
    currentMonthExpenses,
    ytdIncome,
    ytdExpenses,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        ...baseFinanceWhere,
        type: "INCOME",
        date: { gte: currentMonthStart, lte: currentMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        ...baseFinanceWhere,
        type: "EXPENSE",
        date: { gte: currentMonthStart, lte: currentMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        ...baseFinanceWhere,
        type: "INCOME",
        date: { gte: yearStart, lte: currentMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        ...baseFinanceWhere,
        type: "EXPENSE",
        date: { gte: yearStart, lte: currentMonthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  const cmIncome = Number(currentMonthIncome._sum.amount ?? 0);
  const cmExpenses = Number(currentMonthExpenses._sum.amount ?? 0);
  const yIncome = Number(ytdIncome._sum.amount ?? 0);
  const yExpenses = Number(ytdExpenses._sum.amount ?? 0);

  const financialSummary = {
    currentMonth: {
      income: cmIncome,
      expenses: cmExpenses,
      net: cmIncome - cmExpenses,
    },
    yearToDate: {
      income: yIncome,
      expenses: yExpenses,
      net: yIncome - yExpenses,
    },
  };

  // ─── Attention Items ─────────────────────────────────────────────────────
  const attentionItems: Array<{
    type: string;
    message: string;
    count: number;
    link: string;
    priority: "urgent" | "warning" | "info";
  }> = [];

  // Overdue rent: past the 5th of the current month
  if (now.getDate() > 5) {
    // Find active leases that don't have a rent INCOME transaction this month
    const activeLeasesWithTenants = await prisma.lease.findMany({
      where: {
        unit: { propertyId: { in: propertyIds } },
        renewalStatus: "ACTIVE",
        startDate: { lte: currentMonthEnd },
        endDate: { gte: currentMonthStart },
      },
      select: {
        tenantId: true,
        unit: { select: { propertyId: true } },
      },
    });

    const tenantIds = activeLeasesWithTenants.map((l) => l.tenantId);

    if (tenantIds.length > 0) {
      const paidTenants = await prisma.transaction.findMany({
        where: {
          propertyId: { in: propertyIds },
          tenantId: { in: tenantIds },
          type: "INCOME",
          category: "rent",
          status: "COMPLETED",
          date: { gte: currentMonthStart, lte: currentMonthEnd },
        },
        select: { tenantId: true },
        distinct: ["tenantId"],
      });

      const paidTenantIds = new Set(paidTenants.map((t) => t.tenantId));
      const overdueCount = tenantIds.filter(
        (id) => !paidTenantIds.has(id)
      ).length;

      if (overdueCount > 0) {
        attentionItems.push({
          type: "overdue_rent",
          message: `${overdueCount} tenant${overdueCount > 1 ? "s" : ""} ${overdueCount > 1 ? "have" : "has"} overdue rent`,
          count: overdueCount,
          link: "/transactions",
          priority: "urgent",
        });
      }
    }
  }

  // Expiring leases: ending within 90 days
  const ninetyDaysFromNow = new Date(now);
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const expiringLeases = await prisma.lease.count({
    where: {
      unit: { propertyId: { in: propertyIds } },
      renewalStatus: "ACTIVE",
      endDate: { gte: now, lte: ninetyDaysFromNow },
    },
  });

  if (expiringLeases > 0) {
    attentionItems.push({
      type: "expiring_leases",
      message: `${expiringLeases} lease${expiringLeases > 1 ? "s" : ""} expiring within 90 days`,
      count: expiringLeases,
      link: "/leases",
      priority: "warning",
    });
  }

  // Open maintenance requests (not COMPLETED)
  const openMaintenance = await prisma.maintenanceRequest.groupBy({
    by: ["priority"],
    where: {
      propertyId: { in: propertyIds },
      status: { not: "COMPLETED" },
    },
    _count: { id: true },
  });

  const totalOpen = openMaintenance.reduce((sum, g) => sum + g._count.id, 0);
  const emergencyCount =
    openMaintenance.find((g) => g.priority === "EMERGENCY")?._count.id ?? 0;

  if (totalOpen > 0) {
    const emergencyNote =
      emergencyCount > 0 ? ` (${emergencyCount} emergency)` : "";
    attentionItems.push({
      type: "open_maintenance",
      message: `${totalOpen} open maintenance request${totalOpen > 1 ? "s" : ""}${emergencyNote}`,
      count: totalOpen,
      link: "/maintenance",
      priority: emergencyCount > 0 ? "urgent" : "info",
    });
  }

  // Vacant units
  const vacantUnits = await prisma.unit.count({
    where: { propertyId: { in: propertyIds }, status: "VACANT" },
  });

  if (vacantUnits > 0) {
    attentionItems.push({
      type: "vacant_units",
      message: `${vacantUnits} vacant unit${vacantUnits > 1 ? "s" : ""}`,
      count: vacantUnits,
      link: "/properties",
      priority: "info",
    });
  }

  // ─── Recent Activity ─────────────────────────────────────────────────────
  const [recentTransactions, recentMaintenance] = await Promise.all([
    prisma.transaction.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { date: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        category: true,
        amount: true,
        date: true,
        propertyId: true,
      },
    }),
    prisma.maintenanceRequest.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        propertyId: true,
        createdAt: true,
      },
    }),
  ]);

  const recentActivity = {
    transactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: Number(t.amount),
      propertyName: propertyNameMap.get(t.propertyId) ?? "Unknown",
      date: t.date.toISOString(),
    })),
    maintenanceRequests: recentMaintenance.map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      priority: m.priority,
      propertyName: propertyNameMap.get(m.propertyId) ?? "Unknown",
      date: m.createdAt.toISOString(),
    })),
  };

  return Response.json({
    userName: session.user.name ?? "there",
    portfolioStats,
    financialSummary,
    attentionItems,
    recentActivity,
  });
}
