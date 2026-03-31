import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createLeaseSchema = z.object({
  unitId: z.string().min(1, "Unit ID is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  monthlyRent: z.number().positive("Monthly rent must be positive"),
  securityDeposit: z.number().optional(),
  terms: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get("unitId");
  const tenantId = searchParams.get("tenantId");
  const status = searchParams.get("status");

  const leases = await prisma.lease.findMany({
    where: {
      unit: {
        property: { userId: session.user.id },
      },
      ...(unitId ? { unitId } : {}),
      ...(tenantId ? { tenantId } : {}),
      ...(status === "ACTIVE" ||
      status === "EXPIRING_SOON" ||
      status === "EXPIRED" ||
      status === "MONTH_TO_MONTH" ||
      status === "RENEWED"
        ? { renewalStatus: status }
        : {}),
    },
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
      tenant: true,
    },
    orderBy: { startDate: "desc" },
  });

  return Response.json(leases);
}

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

  const parsed = createLeaseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { unitId, tenantId, startDate, endDate, ...rest } = parsed.data;

  // Verify unit ownership
  const unit = await prisma.unit.findFirst({
    where: { id: unitId },
    include: { property: { select: { userId: true } } },
  });

  if (!unit || unit.property.userId !== session.user.id) {
    return Response.json(
      { error: "Unit not found or not owned by you" },
      { status: 404 }
    );
  }

  // Verify tenant ownership
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, userId: session.user.id },
  });

  if (!tenant) {
    return Response.json(
      { error: "Tenant not found or not owned by you" },
      { status: 404 }
    );
  }

  const lease = await prisma.lease.create({
    data: {
      unitId,
      tenantId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      renewalStatus: "ACTIVE",
      ...rest,
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

  // Update unit status to OCCUPIED
  await prisma.unit.update({
    where: { id: unitId },
    data: { status: "OCCUPIED" },
  });

  // Assign tenant to unit if not already assigned
  if (tenant.unitId !== unitId) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { unitId },
    });
  }

  return Response.json(lease, { status: 201 });
}
