import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  unitId: z.string().optional(),
  moveInDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const status = searchParams.get("status");

  const tenants = await prisma.tenant.findMany({
    where: {
      userId: session.user.id,
      ...(status === "ACTIVE" || status === "ARCHIVED" ? { status } : {}),
      ...(propertyId
        ? { unit: { propertyId } }
        : {}),
    },
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
      leases: {
        where: { renewalStatus: "ACTIVE" },
        take: 1,
        orderBy: { startDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(tenants);
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

  const parsed = createTenantSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { unitId, moveInDate, ...rest } = parsed.data;

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
  }

  const tenant = await prisma.tenant.create({
    data: {
      ...rest,
      unitId: unitId ?? undefined,
      moveInDate: moveInDate ? new Date(moveInDate) : undefined,
      userId: session.user.id,
    },
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (unitId) {
    await prisma.unit.update({
      where: { id: unitId },
      data: { status: "OCCUPIED" },
    });
  }

  return Response.json(tenant, { status: 201 });
}
