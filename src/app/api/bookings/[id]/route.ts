import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateBookingSchema = z.object({
  guestId: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  nightlyRate: z.number().positive().optional(),
  totalAmount: z.number().positive().optional(),
  platform: z.enum(["AIRBNB", "VRBO", "DIRECT", "OTHER"]).nullable().optional(),
  confirmationNumber: z.string().nullable().optional(),
  status: z
    .enum(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"])
    .optional(),
  notes: z.string().nullable().optional(),
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

  const booking = await prisma.booking.findFirst({
    where: { id, unit: { property: { userId: session.user.id } } },
    include: {
      guest: true,
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
      cleaningTask: true,
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  return Response.json(booking);
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

  const existing = await prisma.booking.findFirst({
    where: { id, unit: { property: { userId: session.user.id } } },
    include: { cleaningTask: true },
  });

  if (!existing) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { checkInDate, checkOutDate, status, ...rest } = parsed.data;

  const data: Record<string, unknown> = { ...rest };

  if (checkInDate !== undefined) {
    data.checkInDate = new Date(checkInDate);
  }
  if (checkOutDate !== undefined) {
    data.checkOutDate = new Date(checkOutDate);
  }
  if (status !== undefined) {
    data.status = status;
  }

  // If dates are changing, check for conflicts
  const effectiveCheckIn = checkInDate
    ? new Date(checkInDate)
    : existing.checkInDate;
  const effectiveCheckOut = checkOutDate
    ? new Date(checkOutDate)
    : existing.checkOutDate;

  if (checkInDate || checkOutDate) {
    const conflict = await prisma.booking.findFirst({
      where: {
        unitId: existing.unitId,
        id: { not: id },
        status: { not: "CANCELLED" },
        checkInDate: { lt: effectiveCheckOut },
        checkOutDate: { gt: effectiveCheckIn },
      },
    });

    if (conflict) {
      return Response.json(
        { error: "Date conflict: another booking overlaps with these dates" },
        { status: 409 }
      );
    }
  }

  const booking = await prisma.booking.update({
    where: { id },
    data,
    include: {
      guest: true,
      unit: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
      cleaningTask: true,
    },
  });

  // When status changes to CHECKED_OUT, auto-create CleaningTask if none exists
  if (
    status === "CHECKED_OUT" &&
    existing.status !== "CHECKED_OUT" &&
    !existing.cleaningTask
  ) {
    await prisma.cleaningTask.create({
      data: {
        bookingId: id,
        unitId: existing.unitId,
        scheduledDate: effectiveCheckOut,
        status: "PENDING",
      },
    });

    // Re-fetch to include the new cleaning task
    const updated = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        unit: {
          include: {
            property: { select: { id: true, name: true } },
          },
        },
        cleaningTask: true,
      },
    });

    return Response.json(updated);
  }

  return Response.json(booking);
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

  const existing = await prisma.booking.findFirst({
    where: { id, unit: { property: { userId: session.user.id } } },
  });

  if (!existing) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  await prisma.booking.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
