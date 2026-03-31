import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const lateFeeSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM format"),
  gracePeriodDays: z.number().int().positive().optional().default(5),
  lateFeeAmount: z.number().positive().optional().default(50),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = lateFeeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { month, gracePeriodDays, lateFeeAmount } = parsed.data;
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
  const gracePeriodDate = new Date(year, monthNum - 1, gracePeriodDays, 23, 59, 59, 999);
  const now = new Date();

  // Only apply late fees if we're past the grace period
  if (now <= gracePeriodDate) {
    return Response.json(
      { error: `Grace period has not yet passed for ${month}. Late fees can be applied after day ${gracePeriodDays}.` },
      { status: 400 }
    );
  }

  // Find all active leases for this month, scoped to user
  const leases = await prisma.lease.findMany({
    where: {
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
      unit: {
        property: { userId: session.user.id },
      },
    },
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
      tenant: { select: { id: true, name: true } },
    },
  });

  const createdLateFees = [];

  for (const lease of leases) {
    // Check how much rent has been paid
    const paymentsAggregate = await prisma.transaction.aggregate({
      where: {
        tenantId: lease.tenantId,
        unitId: lease.unitId,
        propertyId: lease.unit.propertyId,
        type: "INCOME",
        category: "rent",
        status: "COMPLETED",
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { amount: true },
    });

    const amountPaid = Number(paymentsAggregate._sum.amount ?? 0);
    const monthlyRent = Number(lease.monthlyRent);

    // Skip if fully paid
    if (amountPaid >= monthlyRent) {
      continue;
    }

    // Check if a late_fee transaction already exists for this tenant+unit in this month
    const existingLateFee = await prisma.transaction.findFirst({
      where: {
        tenantId: lease.tenantId,
        unitId: lease.unitId,
        propertyId: lease.unit.propertyId,
        type: "INCOME",
        category: "late_fee",
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    if (existingLateFee) {
      continue;
    }

    // Create the late fee transaction
    const lateFeeTransaction = await prisma.transaction.create({
      data: {
        propertyId: lease.unit.propertyId,
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        type: "INCOME",
        category: "late_fee",
        amount: lateFeeAmount,
        date: now,
        payer: lease.tenant.name,
        status: "PENDING",
        notes: `Late fee for ${month}`,
      },
      include: {
        property: { select: { name: true } },
        unit: { select: { label: true } },
        tenant: { select: { name: true } },
      },
    });

    createdLateFees.push(lateFeeTransaction);
  }

  return Response.json({
    lateFees: createdLateFees,
    count: createdLateFees.length,
    month,
  }, { status: 201 });
}
