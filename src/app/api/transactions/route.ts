import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const createTransactionSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  vendorId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().optional(),
  payee: z.string().optional(),
  payer: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("COMPLETED"),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type");
  const propertyId = searchParams.get("propertyId");
  const unitId = searchParams.get("unitId");
  const tenantId = searchParams.get("tenantId");
  const category = searchParams.get("category");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Prisma.TransactionWhereInput = {
    property: { userId: session.user.id },
    ...(type && { type: type as "INCOME" | "EXPENSE" }),
    ...(propertyId && { propertyId }),
    ...(unitId && { unitId }),
    ...(tenantId && { tenantId }),
    ...(category && { category }),
    ...(status && { status: status as "PENDING" | "COMPLETED" | "CANCELLED" }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        property: { select: { name: true } },
        unit: { select: { label: true } },
        tenant: { select: { name: true } },
        vendor: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where }),
  ]);

  return Response.json({ transactions, total, limit, offset });
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

  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { date, ...rest } = parsed.data;

  // Verify property belongs to user
  const property = await prisma.property.findFirst({
    where: { id: rest.propertyId, userId: session.user.id },
  });

  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...rest,
      date: new Date(date),
    },
    include: {
      property: { select: { name: true } },
      unit: { select: { label: true } },
      tenant: { select: { name: true } },
      vendor: { select: { name: true } },
    },
  });

  return Response.json(transaction, { status: 201 });
}
