import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const paymentItemSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  propertyId: z.string().min(1, "Property is required"),
  leaseId: z.string().min(1, "Lease is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.string().optional(),
});

const batchPaySchema = z.object({
  payments: z.array(paymentItemSchema).min(1, "At least one payment is required"),
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

  const parsed = batchPaySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { payments } = parsed.data;

  // Collect all unique property IDs and verify ownership
  const propertyIds = [...new Set(payments.map((p) => p.propertyId))];
  const ownedProperties = await prisma.property.findMany({
    where: { id: { in: propertyIds }, userId: session.user.id },
    select: { id: true },
  });

  const ownedPropertyIds = new Set(ownedProperties.map((p) => p.id));
  const unauthorizedIds = propertyIds.filter((id) => !ownedPropertyIds.has(id));

  if (unauthorizedIds.length > 0) {
    return Response.json(
      { error: `Properties not found or not owned by you: ${unauthorizedIds.join(", ")}` },
      { status: 404 }
    );
  }

  // Collect all unique tenant IDs and get names
  const tenantIds = [...new Set(payments.map((p) => p.tenantId))];
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds }, userId: session.user.id },
    select: { id: true, name: true },
  });

  const tenantNameMap = new Map(tenants.map((t) => [t.id, t.name]));

  // Verify all tenants found
  const missingTenants = tenantIds.filter((id) => !tenantNameMap.has(id));
  if (missingTenants.length > 0) {
    return Response.json(
      { error: `Tenants not found: ${missingTenants.join(", ")}` },
      { status: 404 }
    );
  }

  // Create all transactions in a single database transaction
  const now = new Date();
  const created = await prisma.$transaction(
    payments.map((payment) =>
      prisma.transaction.create({
        data: {
          propertyId: payment.propertyId,
          unitId: payment.unitId,
          tenantId: payment.tenantId,
          type: "INCOME",
          category: "rent",
          amount: payment.amount,
          date: now,
          payer: tenantNameMap.get(payment.tenantId) ?? "Unknown",
          status: "COMPLETED",
          ...(payment.paymentMethod ? { paymentMethod: payment.paymentMethod } : {}),
          notes: `Rent payment for lease ${payment.leaseId}`,
        },
      })
    )
  );

  return Response.json({ count: created.length }, { status: 201 });
}
