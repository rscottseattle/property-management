import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
  emergencyPhone: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  moveInDate: z.string().nullable().optional(),
  moveOutDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findFirst({
    where: { id, userId: session.user.id },
    include: {
      unit: {
        include: {
          property: true,
        },
      },
      leases: true,
      transactions: {
        take: 10,
        orderBy: { date: "desc" },
      },
      maintenanceRequests: true,
      communicationLogs: {
        take: 20,
        orderBy: { date: "desc" },
      },
      documents: true,
    },
  });

  if (!tenant) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  return Response.json(tenant);
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

  const existing = await prisma.tenant.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTenantSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { unitId, moveInDate, moveOutDate, status, ...rest } = parsed.data;

  // Handle unit change
  if (unitId !== undefined && unitId !== existing.unitId) {
    // Vacate old unit
    if (existing.unitId) {
      await prisma.unit.update({
        where: { id: existing.unitId },
        data: { status: "VACANT" },
      });
    }

    // Verify and occupy new unit
    if (unitId) {
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

      await prisma.unit.update({
        where: { id: unitId },
        data: { status: "OCCUPIED" },
      });
    }
  }

  // Auto-set moveOutDate when archiving
  const autoMoveOutDate =
    status === "ARCHIVED" && !existing.moveOutDate && moveOutDate === undefined
      ? new Date()
      : undefined;

  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      ...rest,
      ...(unitId !== undefined ? { unitId } : {}),
      ...(moveInDate !== undefined
        ? { moveInDate: moveInDate ? new Date(moveInDate) : null }
        : {}),
      ...(moveOutDate !== undefined
        ? { moveOutDate: moveOutDate ? new Date(moveOutDate) : null }
        : autoMoveOutDate
          ? { moveOutDate: autoMoveOutDate }
          : {}),
      ...(status ? { status } : {}),
    },
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
    },
  });

  return Response.json(tenant);
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

  const existing = await prisma.tenant.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  await prisma.tenant.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
