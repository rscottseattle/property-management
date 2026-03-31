import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createCleaningSchema = z.object({
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  vendorId: z.string().optional(),
  checklistItems: z.any().optional(),
  notes: z.string().optional(),
  cost: z.number().positive().optional(),
});

const updateCleaningSchema = z.object({
  scheduledDate: z.string().optional(),
  vendorId: z.string().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "INSPECTED"]).optional(),
  checklistItems: z.any().optional(),
  notes: z.string().nullable().optional(),
  cost: z.number().positive().nullable().optional(),
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

  // Verify booking ownership
  const booking = await prisma.booking.findFirst({
    where: { id, unit: { property: { userId: session.user.id } } },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  const cleaningTask = await prisma.cleaningTask.findUnique({
    where: { bookingId: id },
    include: {
      vendor: { select: { id: true, name: true } },
      unit: { select: { label: true } },
    },
  });

  if (!cleaningTask) {
    return Response.json(
      { error: "No cleaning task found for this booking" },
      { status: 404 }
    );
  }

  return Response.json(cleaningTask);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify booking ownership and get unit info
  const booking = await prisma.booking.findFirst({
    where: { id, unit: { property: { userId: session.user.id } } },
    include: { cleaningTask: true },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.cleaningTask) {
    return Response.json(
      { error: "A cleaning task already exists for this booking" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCleaningSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { scheduledDate, vendorId, ...rest } = parsed.data;

  // If vendorId provided, verify it belongs to user
  if (vendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, userId: session.user.id },
    });
    if (!vendor) {
      return Response.json({ error: "Vendor not found" }, { status: 404 });
    }
  }

  const cleaningTask = await prisma.cleaningTask.create({
    data: {
      ...rest,
      bookingId: id,
      unitId: booking.unitId,
      vendorId: vendorId || undefined,
      scheduledDate: new Date(scheduledDate),
      status: "PENDING",
    },
    include: {
      vendor: { select: { id: true, name: true } },
      unit: { select: { label: true } },
    },
  });

  return Response.json(cleaningTask, { status: 201 });
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

  // Verify booking ownership
  const booking = await prisma.booking.findFirst({
    where: { id, unit: { property: { userId: session.user.id } } },
    include: {
      cleaningTask: true,
      unit: { include: { property: { select: { id: true } } } },
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!booking.cleaningTask) {
    return Response.json(
      { error: "No cleaning task found for this booking" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateCleaningSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { scheduledDate, status, ...rest } = parsed.data;

  const data: Record<string, unknown> = { ...rest };

  if (scheduledDate !== undefined) {
    data.scheduledDate = new Date(scheduledDate);
  }
  if (status !== undefined) {
    data.status = status;
  }

  const cleaningTask = await prisma.cleaningTask.update({
    where: { id: booking.cleaningTask.id },
    data,
    include: {
      vendor: { select: { id: true, name: true } },
      unit: { select: { label: true } },
    },
  });

  // When status changes to COMPLETED and cost is set, auto-create expense transaction
  if (
    status === "COMPLETED" &&
    booking.cleaningTask.status !== "COMPLETED" &&
    (cleaningTask.cost !== null)
  ) {
    await prisma.transaction.create({
      data: {
        propertyId: booking.unit.property.id,
        unitId: booking.unitId,
        vendorId: cleaningTask.vendorId || undefined,
        type: "EXPENSE",
        category: "cleaning_and_maintenance",
        amount: cleaningTask.cost!,
        date: new Date(),
        status: "COMPLETED",
        notes: `Cleaning for booking ${booking.confirmationNumber || id}`,
      },
    });
  }

  return Response.json(cleaningTask);
}
