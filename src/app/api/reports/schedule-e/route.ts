import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCHEDULE_E_CATEGORIES } from "@/lib/constants";

const SCHEDULE_E_CATEGORY_VALUES = SCHEDULE_E_CATEGORIES.map((c) => c.value);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const propertyId = searchParams.get("propertyId");

  if (!yearParam) {
    return Response.json({ error: "year is required" }, { status: 400 });
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return Response.json({ error: "Invalid year" }, { status: 400 });
  }

  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

  // Fetch properties
  const properties = await prisma.property.findMany({
    where: {
      userId: session.user.id,
      ...(propertyId && { id: propertyId }),
    },
    select: { id: true, name: true, address: true, city: true, state: true, zipCode: true },
  });

  if (properties.length === 0) {
    return Response.json({ properties: [], totals: null });
  }

  const propertyIds = properties.map((p) => p.id);

  // Fetch all completed transactions for these properties in the year
  const transactions = await prisma.transaction.findMany({
    where: {
      propertyId: { in: propertyIds },
      status: "COMPLETED",
      date: { gte: startDate, lte: endDate },
    },
    select: {
      propertyId: true,
      type: true,
      category: true,
      amount: true,
    },
  });

  // Build per-property reports
  const propertyReports = properties.map((property) => {
    const propertyTransactions = transactions.filter(
      (t) => t.propertyId === property.id
    );

    const totalRentalIncome = propertyTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Build expense breakdown by Schedule E category
    const expenses: Record<string, number> = {};
    for (const cat of SCHEDULE_E_CATEGORY_VALUES) {
      expenses[cat] = 0;
    }

    for (const t of propertyTransactions) {
      if (t.type !== "EXPENSE") continue;
      const cat = SCHEDULE_E_CATEGORY_VALUES.includes(
        t.category as (typeof SCHEDULE_E_CATEGORY_VALUES)[number]
      )
        ? t.category
        : "other";
      expenses[cat] = (expenses[cat] ?? 0) + Number(t.amount);
    }

    const totalExpenses = Object.values(expenses).reduce(
      (sum, val) => sum + val,
      0
    );

    return {
      propertyId: property.id,
      propertyName: property.name,
      propertyAddress: `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`,
      totalRentalIncome,
      expenses,
      totalExpenses,
      netIncome: totalRentalIncome - totalExpenses,
    };
  });

  // Portfolio totals
  const totals = {
    totalRentalIncome: propertyReports.reduce(
      (sum, r) => sum + r.totalRentalIncome,
      0
    ),
    expenses: {} as Record<string, number>,
    totalExpenses: propertyReports.reduce(
      (sum, r) => sum + r.totalExpenses,
      0
    ),
    netIncome: 0,
  };

  for (const cat of SCHEDULE_E_CATEGORY_VALUES) {
    totals.expenses[cat] = propertyReports.reduce(
      (sum, r) => sum + (r.expenses[cat] ?? 0),
      0
    );
  }

  totals.netIncome = totals.totalRentalIncome - totals.totalExpenses;

  return Response.json({
    year,
    properties: propertyReports,
    totals,
  });
}
