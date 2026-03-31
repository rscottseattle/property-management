import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  trade: z.string().min(1, "Trade is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const trade = searchParams.get("trade");

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };
  if (trade) where.trade = trade;

  const vendors = await prisma.vendor.findMany({
    where,
    include: {
      _count: {
        select: {
          maintenanceRequests: true,
          transactions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(vendors);
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

  const parsed = createVendorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const vendor = await prisma.vendor.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
  });

  return Response.json(vendor, { status: 201 });
}
