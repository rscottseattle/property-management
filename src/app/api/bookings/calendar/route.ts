import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const unitId = searchParams.get("unitId");

  if (!startDate || !endDate) {
    return Response.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const where: Record<string, unknown> = {
    unit: {
      property: { userId: session.user.id, type: "SHORT_TERM" },
      ...(unitId ? { id: unitId } : {}),
    },
    checkInDate: { lte: end },
    checkOutDate: { gte: start },
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      guest: { select: { name: true } },
      unit: {
        select: {
          id: true,
          label: true,
          property: { select: { name: true } },
        },
      },
    },
    orderBy: { checkInDate: "asc" },
  });

  const calendarData = bookings.map((booking) => ({
    id: booking.id,
    unitId: booking.unit.id,
    unitLabel: booking.unit.label,
    propertyName: booking.unit.property.name,
    guestName: booking.guest.name,
    checkIn: booking.checkInDate,
    checkOut: booking.checkOutDate,
    status: booking.status,
    platform: booking.platform,
    nightlyRate: booking.nightlyRate,
    totalAmount: booking.totalAmount,
  }));

  return Response.json(calendarData);
}
