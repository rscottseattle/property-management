import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createMaintenanceSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]).default("MEDIUM"),
  photos: z.array(z.string()).optional(),
  vendorId: z.string().optional(),
  estimatedCompletionDate: z.string().optional(),
});

const priorityOrder: Record<string, number> = {
  EMERGENCY: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const unitId = searchParams.get("unitId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const vendorId = searchParams.get("vendorId");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = {
    property: { userId: session.user.id },
  };
  if (propertyId) where.propertyId = propertyId;
  if (unitId) where.unitId = unitId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (vendorId) where.vendorId = vendorId;

  const [requests, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      include: {
        property: { select: { name: true } },
        unit: { select: { label: true } },
        tenant: { select: { name: true } },
        vendor: { select: { name: true } },
        _count: { select: { notes: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.maintenanceRequest.count({ where }),
  ]);

  // Re-sort by custom priority order (Prisma sorts alphabetically by default)
  requests.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 99;
    const pb = priorityOrder[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return Response.json(requests);
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

  const parsed = createMaintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { estimatedCompletionDate, ...rest } = parsed.data;

  // Verify property ownership
  const property = await prisma.property.findFirst({
    where: { id: rest.propertyId, userId: session.user.id },
  });
  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  const maintenanceRequest = await prisma.maintenanceRequest.create({
    data: {
      ...rest,
      status: "SUBMITTED",
      estimatedCompletionDate: estimatedCompletionDate
        ? new Date(estimatedCompletionDate)
        : undefined,
    },
    include: {
      property: { select: { name: true } },
      unit: { select: { label: true } },
      tenant: { select: { name: true } },
      vendor: { select: { name: true } },
    },
  });

  return Response.json(maintenanceRequest, { status: 201 });
}
