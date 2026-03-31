import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createBookingSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  guestId: z.string().min(1, "Guest is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  nightlyRate: z.number().positive("Nightly rate must be positive"),
  totalAmount: z.number().positive("Total amount must be positive"),
  platform: z.enum(["AIRBNB", "VRBO", "DIRECT", "OTHER"]).optional(),
  confirmationNumber: z.string().optional(),
  status: z
    .enum(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"])
    .default("CONFIRMED"),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get("unitId");
  const guestId = searchParams.get("guestId");
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {
    unit: { property: { userId: session.user.id } },
  };

  if (unitId) where.unitId = unitId;
  if (guestId) where.guestId = guestId;
  if (status) where.status = status;

  // Overlapping date range: bookings that overlap with [startDate, endDate]
  if (startDate && endDate) {
    where.checkInDate = { lte: new Date(endDate) };
    where.checkOutDate = { gte: new Date(startDate) };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      guest: { select: { name: true, platform: true } },
      unit: {
        select: {
          label: true,
          property: { select: { name: true } },
        },
      },
    },
    orderBy: { checkInDate: "desc" },
  });

  return Response.json(bookings);
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

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { checkInDate, checkOutDate, ...rest } = parsed.data;

  // Verify unit ownership through property
  const unit = await prisma.unit.findFirst({
    where: { id: rest.unitId, property: { userId: session.user.id } },
  });
  if (!unit) {
    return Response.json({ error: "Unit not found" }, { status: 404 });
  }

  // Verify guest belongs to user
  const guest = await prisma.guest.findFirst({
    where: { id: rest.guestId, userId: session.user.id },
  });
  if (!guest) {
    return Response.json({ error: "Guest not found" }, { status: 404 });
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkOut <= checkIn) {
    return Response.json(
      { error: "Check-out date must be after check-in date" },
      { status: 400 }
    );
  }

  // Check for date conflicts (overlapping bookings for same unit)
  const conflict = await prisma.booking.findFirst({
    where: {
      unitId: rest.unitId,
      status: { not: "CANCELLED" },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
  });

  if (conflict) {
    return Response.json(
      { error: "Date conflict: another booking overlaps with these dates" },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      ...rest,
      checkInDate: checkIn,
      checkOutDate: checkOut,
    },
    include: {
      guest: { select: { name: true, platform: true } },
      unit: {
        select: {
          label: true,
          property: { select: { name: true } },
        },
      },
    },
  });

  return Response.json(booking, { status: 201 });
}
