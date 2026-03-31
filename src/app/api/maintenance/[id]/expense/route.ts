import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().optional(),
  vendorId: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership and get property/unit info
  const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
    where: { id, property: { userId: session.user.id } },
    select: { id: true, propertyId: true, unitId: true },
  });

  if (!maintenanceRequest) {
    return Response.json(
      { error: "Maintenance request not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { date, vendorId, ...rest } = parsed.data;

  // If vendorId provided, verify it belongs to the user
  if (vendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, userId: session.user.id },
    });
    if (!vendor) {
      return Response.json({ error: "Vendor not found" }, { status: 404 });
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...rest,
      propertyId: maintenanceRequest.propertyId,
      unitId: maintenanceRequest.unitId,
      vendorId: vendorId || undefined,
      maintenanceRequestId: id,
      type: "EXPENSE",
      category: "repairs",
      status: "COMPLETED",
      date: date ? new Date(date) : new Date(),
    },
    include: {
      property: { select: { name: true } },
      vendor: { select: { name: true } },
    },
  });

  return Response.json(transaction, { status: 201 });
}
