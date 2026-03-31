import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RecurrenceRule {
  pattern: "monthly" | "quarterly" | "annually";
  dayOfMonth?: number;
  endDate?: string;
}

function getNextOccurrence(
  lastDate: Date,
  rule: RecurrenceRule
): Date {
  const next = new Date(lastDate);
  switch (rule.pattern) {
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  if (rule.dayOfMonth) {
    next.setDate(rule.dayOfMonth);
  }
  return next;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recurringTransactions = await prisma.transaction.findMany({
    where: {
      isRecurring: true,
      property: { userId: session.user.id },
    },
    include: {
      property: { select: { name: true } },
      childTransactions: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
    },
    orderBy: { date: "desc" },
  });

  const result = recurringTransactions.map((t) => ({
    ...t,
    latestChildDate: t.childTransactions[0]?.date ?? null,
    childTransactions: undefined,
  }));

  return Response.json(result);
}

export async function POST(_request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recurringTransactions = await prisma.transaction.findMany({
    where: {
      isRecurring: true,
      property: { userId: session.user.id },
    },
    include: {
      childTransactions: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
    },
  });

  const now = new Date();
  let generatedCount = 0;

  for (const parent of recurringTransactions) {
    if (!parent.recurrenceRule) continue;

    let rule: RecurrenceRule;
    try {
      rule = JSON.parse(parent.recurrenceRule) as RecurrenceRule;
    } catch {
      continue;
    }

    // Check if rule has expired
    if (rule.endDate && new Date(rule.endDate) < now) {
      continue;
    }

    // Determine the last generated date
    const lastDate =
      parent.childTransactions[0]?.date ?? parent.date;

    // Calculate next occurrence
    const nextDate = getNextOccurrence(lastDate, rule);

    // Only generate if the next occurrence is in the past or current period
    if (nextDate > now) continue;

    // Generate all missing occurrences up to now
    let currentDate = nextDate;
    while (currentDate <= now) {
      // Check end date
      if (rule.endDate && currentDate > new Date(rule.endDate)) break;

      await prisma.transaction.create({
        data: {
          propertyId: parent.propertyId,
          unitId: parent.unitId,
          tenantId: parent.tenantId,
          vendorId: parent.vendorId,
          type: parent.type,
          category: parent.category,
          amount: parent.amount,
          date: currentDate,
          paymentMethod: parent.paymentMethod,
          payee: parent.payee,
          payer: parent.payer,
          notes: parent.notes,
          isRecurring: false,
          parentTransactionId: parent.id,
          status: "PENDING",
        },
      });

      generatedCount++;
      currentDate = getNextOccurrence(currentDate, rule);
    }
  }

  return Response.json({ generated: generatedCount });
}
