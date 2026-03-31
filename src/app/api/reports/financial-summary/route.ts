import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const propertyId = searchParams.get("propertyId");

  if (!startDate || !endDate) {
    return Response.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const baseWhere: Prisma.TransactionWhereInput = {
    property: { userId: session.user.id },
    status: "COMPLETED",
    date: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
    ...(propertyId && { propertyId }),
  };

  // Total income and expenses
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...baseWhere, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
  const netIncome = totalIncome - totalExpenses;

  // Income by category
  const incomeByCategory = await prisma.transaction.groupBy({
    by: ["category"],
    where: { ...baseWhere, type: "INCOME" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  // Expenses by category
  const expensesByCategory = await prisma.transaction.groupBy({
    by: ["category"],
    where: { ...baseWhere, type: "EXPENSE" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  // Income by property
  const incomeByPropertyRaw = await prisma.transaction.groupBy({
    by: ["propertyId"],
    where: { ...baseWhere, type: "INCOME" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  // Expenses by property
  const expensesByPropertyRaw = await prisma.transaction.groupBy({
    by: ["propertyId"],
    where: { ...baseWhere, type: "EXPENSE" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  // Fetch property names for the grouped results
  const propertyIds = [
    ...new Set([
      ...incomeByPropertyRaw.map((r) => r.propertyId),
      ...expensesByPropertyRaw.map((r) => r.propertyId),
    ]),
  ];

  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    select: { id: true, name: true },
  });

  const propertyNameMap = new Map(properties.map((p) => [p.id, p.name]));

  const incomeByProperty = incomeByPropertyRaw.map((r) => ({
    propertyId: r.propertyId,
    propertyName: propertyNameMap.get(r.propertyId) ?? "Unknown",
    total: Number(r._sum.amount ?? 0),
  }));

  const expensesByProperty = expensesByPropertyRaw.map((r) => ({
    propertyId: r.propertyId,
    propertyName: propertyNameMap.get(r.propertyId) ?? "Unknown",
    total: Number(r._sum.amount ?? 0),
  }));

  // Monthly trend — use raw query for date truncation
  const allTransactions = await prisma.transaction.findMany({
    where: baseWhere,
    select: { type: true, amount: true, date: true },
    orderBy: { date: "asc" },
  });

  const monthlyMap = new Map<
    string,
    { income: number; expenses: number }
  >();

  for (const t of allTransactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key) ?? { income: 0, expenses: 0 };
    if (t.type === "INCOME") {
      existing.income += Number(t.amount);
    } else {
      existing.expenses += Number(t.amount);
    }
    monthlyMap.set(key, existing);
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));

  return Response.json({
    totalIncome,
    totalExpenses,
    netIncome,
    incomeByCategory: incomeByCategory.map((r) => ({
      category: r.category,
      total: Number(r._sum.amount ?? 0),
    })),
    expensesByCategory: expensesByCategory.map((r) => ({
      category: r.category,
      total: Number(r._sum.amount ?? 0),
    })),
    incomeByProperty,
    expensesByProperty,
    monthlyTrend,
  });
}
