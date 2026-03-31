import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateUnitSchema = z.object({
  label: z.string().min(1).optional(),
  bedrooms: z.number().int().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  squareFootage: z.number().int().nullable().optional(),
  status: z.enum(["OCCUPIED", "VACANT", "MAINTENANCE"]).optional(),
});

async function verifyOwnership(propertyId: string, unitId: string, userId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId },
  });

  if (!property) return null;

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, propertyId },
  });

  return unit;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, unitId } = await params;

  const unit = await verifyOwnership(id, unitId, session.user.id);
  if (!unit) {
    return Response.json({ error: "Unit not found" }, { status: 404 });
  }

  const fullUnit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      tenant: true,
      leases: {
        where: { renewalStatus: "ACTIVE" },
        take: 1,
        orderBy: { startDate: "desc" },
      },
      transactions: {
        take: 10,
        orderBy: { date: "desc" },
      },
      maintenanceRequests: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return Response.json(fullUnit);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, unitId } = await params;

  const unit = await verifyOwnership(id, unitId, session.user.id);
  if (!unit) {
    return Response.json({ error: "Unit not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateUnitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const updated = await prisma.unit.update({
    where: { id: unitId },
    data: parsed.data,
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, unitId } = await params;

  const unit = await verifyOwnership(id, unitId, session.user.id);
  if (!unit) {
    return Response.json({ error: "Unit not found" }, { status: 404 });
  }

  await prisma.unit.delete({ where: { id: unitId } });

  return new Response(null, { status: 204 });
}
