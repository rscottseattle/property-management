import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM format");

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const propertyId = searchParams.get("propertyId");

  if (!month) {
    return Response.json({ error: "month query parameter is required (YYYY-MM)" }, { status: 400 });
  }

  const monthParsed = monthSchema.safeParse(month);
  if (!monthParsed.success) {
    return Response.json({ error: "month must be in YYYY-MM format" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
  const gracePeriodDate = new Date(year, monthNum - 1, 5, 23, 59, 59, 999);
  const now = new Date();

  // Find all active leases for this month, scoped to user
  const leaseWhere: Prisma.LeaseWhereInput = {
    startDate: { lte: monthEnd },
    endDate: { gte: monthStart },
    unit: {
      property: {
        userId: session.user.id,
        ...(propertyId ? { id: propertyId } : {}),
      },
    },
  };

  const leases = await prisma.lease.findMany({
    where: leaseWhere,
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
      tenant: { select: { id: true, name: true } },
    },
    orderBy: [
      { unit: { property: { name: "asc" } } },
      { unit: { label: "asc" } },
    ],
  });

  // For each lease, check payment status
  const rentRoll = await Promise.all(
    leases.map(async (lease) => {
      // Sum completed rent payments for this tenant+unit in this month
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
      const amountDue = monthlyRent - amountPaid;

      let paymentStatus: "paid" | "partial" | "unpaid";
      if (amountPaid >= monthlyRent) {
        paymentStatus = "paid";
      } else if (amountPaid > 0) {
        paymentStatus = "partial";
      } else {
        paymentStatus = "unpaid";
      }

      const isLate =
        paymentStatus !== "paid" && now > gracePeriodDate;

      return {
        leaseId: lease.id,
        unitId: lease.unitId,
        unitLabel: lease.unit.label,
        propertyId: lease.unit.property.id,
        propertyName: lease.unit.property.name,
        tenantId: lease.tenant.id,
        tenantName: lease.tenant.name,
        monthlyRent,
        dueDate: monthStart.toISOString(),
        paymentStatus,
        amountPaid,
        amountDue,
        isLate,
      };
    })
  );

  const totalExpected = rentRoll.reduce((sum, e) => sum + e.monthlyRent, 0);
  const totalCollected = rentRoll.reduce((sum, e) => sum + e.amountPaid, 0);
  const outstanding = totalExpected - totalCollected;
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  const entries = rentRoll.map((e, i) => ({
    id: `${e.unitId}-${month}-${i}`,
    propertyId: e.propertyId,
    propertyName: e.propertyName,
    unitId: e.unitId,
    unitName: e.unitLabel,
    tenantId: e.tenantId,
    tenantName: e.tenantName,
    leaseId: e.leaseId,
    monthlyRent: e.monthlyRent,
    amountPaid: e.amountPaid,
    amountDue: e.amountDue,
    dueDate: e.dueDate,
    status: e.isLate ? "late" : e.paymentStatus,
  }));

  return Response.json({
    entries,
    summary: { totalExpected, totalCollected, outstanding, collectionRate },
  });
}
