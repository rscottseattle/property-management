import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const markPaidSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  propertyId: z.string().min(1, "Property is required"),
  leaseId: z.string().min(1, "Lease is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().optional(),
  paymentMethod: z.string().optional(),
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

  const parsed = markPaidSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { unitId, tenantId, propertyId, leaseId, amount, date, paymentMethod } = parsed.data;

  // Verify property belongs to user
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: session.user.id },
  });

  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  // Get tenant name for the payer field
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, userId: session.user.id },
    select: { name: true },
  });

  if (!tenant) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      propertyId,
      unitId,
      tenantId,
      type: "INCOME",
      category: "rent",
      amount,
      date: date ? new Date(date) : new Date(),
      payer: tenant.name,
      status: "COMPLETED",
      ...(paymentMethod ? { paymentMethod } : {}),
      notes: `Rent payment for lease ${leaseId}`,
    },
    include: {
      property: { select: { name: true } },
      unit: { select: { label: true } },
      tenant: { select: { name: true } },
    },
  });

  return Response.json(transaction, { status: 201 });
}
