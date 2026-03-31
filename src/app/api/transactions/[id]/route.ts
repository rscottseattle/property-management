import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateTransactionSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().nullable().optional(),
  tenantId: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  paymentMethod: z.string().nullable().optional(),
  payee: z.string().nullable().optional(),
  payer: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().nullable().optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
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

  const transaction = await prisma.transaction.findFirst({
    where: { id, property: { userId: session.user.id } },
    include: {
      property: { select: { name: true } },
      unit: { select: { label: true } },
      tenant: { select: { name: true } },
      vendor: { select: { name: true } },
    },
  });

  if (!transaction) {
    return Response.json({ error: "Transaction not found" }, { status: 404 });
  }

  return Response.json(transaction);
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

  const existing = await prisma.transaction.findFirst({
    where: { id, property: { userId: session.user.id } },
  });

  if (!existing) {
    return Response.json({ error: "Transaction not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { date, propertyId, ...rest } = parsed.data;

  // If changing property, verify the new property belongs to user
  if (propertyId && propertyId !== existing.propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: session.user.id },
    });
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...rest,
      ...(propertyId !== undefined ? { propertyId } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
    },
    include: {
      property: { select: { name: true } },
      unit: { select: { label: true } },
      tenant: { select: { name: true } },
      vendor: { select: { name: true } },
    },
  });

  return Response.json(transaction);
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

  const existing = await prisma.transaction.findFirst({
    where: { id, property: { userId: session.user.id } },
  });

  if (!existing) {
    return Response.json({ error: "Transaction not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
