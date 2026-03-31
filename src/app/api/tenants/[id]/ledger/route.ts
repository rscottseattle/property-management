import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { INCOME_CATEGORIES, SCHEDULE_E_CATEGORIES } from "@/lib/constants";

// Build a label map from all known categories
const categoryLabelMap = new Map<string, string>([
  ...INCOME_CATEGORIES.map((c) => [c.value, c.label] as [string, string]),
  ...SCHEDULE_E_CATEGORIES.map((c) => [c.value, c.label] as [string, string]),
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify tenant belongs to user
  const tenant = await prisma.tenant.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });

  if (!tenant) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const dateFilter: Prisma.TransactionWhereInput = {};
  if (startDate || endDate) {
    dateFilter.date = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    };
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId: id,
      property: { userId: session.user.id },
      ...dateFilter,
    },
    include: {
      property: { select: { name: true } },
      unit: { select: { label: true } },
    },
    orderBy: { date: "asc" },
  });

  // Build ledger entries with running balance
  // Charges (rent, late_fee, etc. on INCOME type with PENDING/COMPLETED) increase what tenant owes
  // Payments (INCOME COMPLETED for rent, etc.) decrease what tenant owes
  // We treat INCOME transactions as payments (money coming in from tenant)
  // EXPENSE transactions related to tenant would be credits
  let runningBalance = 0;
  let totalCharges = 0;
  let totalPayments = 0;
  let totalCredits = 0;

  const ledger = transactions.map((tx) => {
    const amount = Number(tx.amount);
    const description = categoryLabelMap.get(tx.category) ?? tx.category;

    // Determine the ledger entry type:
    // - INCOME + category rent/late_fee/pet_fee/etc = these are charges that get paid
    //   If status=COMPLETED, it's a payment received
    //   If status=PENDING, it's a charge owed
    // For simplicity and clarity:
    //   INCOME COMPLETED = payment (reduces balance)
    //   INCOME PENDING = charge (increases balance)
    //   EXPENSE = credit to tenant (reduces balance)
    let type: "charge" | "payment" | "credit" | "late_fee";
    let balanceEffect: number;

    if (tx.type === "INCOME" && tx.category === "late_fee") {
      type = "late_fee";
      if (tx.status === "COMPLETED") {
        // Late fee was paid
        type = "payment";
        balanceEffect = -amount;
        totalPayments += amount;
      } else {
        // Late fee charged
        balanceEffect = amount;
        totalCharges += amount;
      }
    } else if (tx.type === "INCOME") {
      if (tx.status === "COMPLETED") {
        type = "payment";
        balanceEffect = -amount;
        totalPayments += amount;
      } else {
        type = "charge";
        balanceEffect = amount;
        totalCharges += amount;
      }
    } else {
      // EXPENSE — credit to tenant
      type = "credit";
      balanceEffect = -amount;
      totalCredits += amount;
    }

    runningBalance += balanceEffect;

    return {
      id: tx.id,
      date: tx.date,
      type,
      description,
      category: tx.category,
      amount,
      runningBalance,
      status: tx.status,
      propertyName: tx.property?.name,
      unitLabel: tx.unit?.label,
      notes: tx.notes,
    };
  });

  return Response.json({
    tenantId: tenant.id,
    tenantName: tenant.name,
    ledger,
    summary: {
      totalCharges,
      totalPayments,
      totalCredits,
      currentBalance: runningBalance,
    },
  });
}
