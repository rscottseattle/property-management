import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  trade: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional(),
  website: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
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

  const vendor = await prisma.vendor.findFirst({
    where: { id, userId: session.user.id },
    include: {
      maintenanceRequests: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          property: { select: { name: true } },
        },
      },
      transactions: {
        take: 10,
        orderBy: { date: "desc" },
        select: {
          id: true,
          amount: true,
          date: true,
          category: true,
          notes: true,
          property: { select: { name: true } },
        },
      },
    },
  });

  if (!vendor) {
    return Response.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Calculate total spend from all vendor transactions
  const totalSpendResult = await prisma.transaction.aggregate({
    where: { vendorId: id },
    _sum: { amount: true },
  });

  return Response.json({
    ...vendor,
    totalSpend: totalSpendResult._sum.amount || 0,
  });
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

  const existing = await prisma.vendor.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Vendor not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateVendorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const vendor = await prisma.vendor.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json(vendor);
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

  const existing = await prisma.vendor.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Vendor not found" }, { status: 404 });
  }

  await prisma.vendor.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
