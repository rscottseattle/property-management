import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updatePropertySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  zipCode: z.string().min(1).optional(),
  type: z.enum(["LONG_TERM", "SHORT_TERM"]).optional(),
  purchasePrice: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  mortgageAmount: z.number().nullable().optional(),
  insuranceCost: z.number().nullable().optional(),
  propertyTax: z.number().nullable().optional(),
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

  const property = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
    include: {
      units: {
        include: {
          tenant: true,
          leases: {
            where: { renewalStatus: "ACTIVE" },
            take: 1,
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
  });

  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  return Response.json(property);
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

  const existing = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updatePropertySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { purchaseDate, ...rest } = parsed.data;

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...rest,
      ...(purchaseDate !== undefined
        ? { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }
        : {}),
    },
    include: { units: true },
  });

  return Response.json(property);
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

  const existing = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  await prisma.property.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
