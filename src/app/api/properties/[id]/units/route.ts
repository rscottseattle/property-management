import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createUnitSchema = z.object({
  label: z.string().min(1, "Label is required"),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  squareFootage: z.number().int().optional(),
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

  const property = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  const units = await prisma.unit.findMany({
    where: { propertyId: id },
    include: {
      tenant: true,
      leases: {
        where: { renewalStatus: "ACTIVE" },
        take: 1,
        orderBy: { startDate: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(units);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createUnitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const unit = await prisma.unit.create({
    data: {
      ...parsed.data,
      propertyId: id,
    },
  });

  return Response.json(unit, { status: 201 });
}
