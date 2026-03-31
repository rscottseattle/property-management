import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateLeaseSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  monthlyRent: z.number().positive().optional(),
  securityDeposit: z.number().nullable().optional(),
  renewalStatus: z
    .enum(["ACTIVE", "EXPIRING_SOON", "EXPIRED", "MONTH_TO_MONTH", "RENEWED"])
    .optional(),
  terms: z.string().nullable().optional(),
});

async function verifyLeaseOwnership(leaseId: string, userId: string) {
  return prisma.lease.findFirst({
    where: {
      id: leaseId,
      unit: {
        property: { userId },
      },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const lease = await prisma.lease.findFirst({
    where: {
      id,
      unit: {
        property: { userId: session.user.id },
      },
    },
    include: {
      unit: {
        include: {
          property: true,
        },
      },
      tenant: true,
      documents: true,
    },
  });

  if (!lease) {
    return Response.json({ error: "Lease not found" }, { status: 404 });
  }

  return Response.json(lease);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await verifyLeaseOwnership(id, session.user.id);
  if (!existing) {
    return Response.json({ error: "Lease not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateLeaseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { startDate, endDate, renewalStatus, ...rest } = parsed.data;

  // Determine the effective endDate for auto-calculation
  const effectiveEndDate = endDate
    ? new Date(endDate)
    : existing.endDate;

  // Auto-calculate renewalStatus if not explicitly set
  let computedRenewalStatus = renewalStatus;
  if (!computedRenewalStatus) {
    const now = new Date();
    const ninetyDaysFromNow = new Date(
      now.getTime() + 90 * 24 * 60 * 60 * 1000
    );

    if (effectiveEndDate < now) {
      computedRenewalStatus = "EXPIRED";
    } else if (effectiveEndDate <= ninetyDaysFromNow) {
      computedRenewalStatus = "EXPIRING_SOON";
    }
  }

  const lease = await prisma.lease.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(computedRenewalStatus ? { renewalStatus: computedRenewalStatus } : {}),
    },
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
      tenant: true,
    },
  });

  return Response.json(lease);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await verifyLeaseOwnership(id, session.user.id);
  if (!existing) {
    return Response.json({ error: "Lease not found" }, { status: 404 });
  }

  await prisma.lease.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
