import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateMaintenanceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]).optional(),
  status: z
    .enum(["SUBMITTED", "ACKNOWLEDGED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"])
    .optional(),
  photos: z.array(z.string()).optional(),
  vendorId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  tenantId: z.string().nullable().optional(),
  estimatedCompletionDate: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
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

  const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
    where: { id, property: { userId: session.user.id } },
    include: {
      property: true,
      unit: true,
      tenant: true,
      vendor: true,
      notes: { orderBy: { createdAt: "desc" } },
      transactions: true,
    },
  });

  if (!maintenanceRequest) {
    return Response.json(
      { error: "Maintenance request not found" },
      { status: 404 }
    );
  }

  return Response.json(maintenanceRequest);
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

  const existing = await prisma.maintenanceRequest.findFirst({
    where: { id, property: { userId: session.user.id } },
  });

  if (!existing) {
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

  const parsed = updateMaintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { estimatedCompletionDate, completedDate, vendorId, status, ...rest } =
    parsed.data;

  // Build the update data
  const data: Record<string, unknown> = { ...rest };

  if (estimatedCompletionDate !== undefined) {
    data.estimatedCompletionDate = estimatedCompletionDate
      ? new Date(estimatedCompletionDate)
      : null;
  }

  if (completedDate !== undefined) {
    data.completedDate = completedDate ? new Date(completedDate) : null;
  }

  if (vendorId !== undefined) {
    data.vendorId = vendorId;
  }

  // Determine the effective status
  let effectiveStatus = status;

  // When vendorId is set and status is still SUBMITTED, auto-advance to ACKNOWLEDGED
  if (
    vendorId &&
    !status &&
    existing.status === "SUBMITTED"
  ) {
    effectiveStatus = "ACKNOWLEDGED";
  }

  if (effectiveStatus) {
    data.status = effectiveStatus;

    // When status changes to COMPLETED, auto-set completedDate if not provided
    if (effectiveStatus === "COMPLETED" && completedDate === undefined) {
      data.completedDate = new Date();
    }
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data,
    include: {
      property: true,
      unit: true,
      tenant: true,
      vendor: true,
      notes: { orderBy: { createdAt: "desc" } },
      transactions: true,
    },
  });

  return Response.json(updated);
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

  const existing = await prisma.maintenanceRequest.findFirst({
    where: { id, property: { userId: session.user.id } },
  });

  if (!existing) {
    return Response.json(
      { error: "Maintenance request not found" },
      { status: 404 }
    );
  }

  await prisma.maintenanceRequest.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
