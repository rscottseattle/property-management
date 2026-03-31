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

  // Get all STR units for the user (for available nights calculation)
  const strUnits = await prisma.unit.findMany({
    where: {
      property: { userId: session.user.id, type: "SHORT_TERM" },
      ...(unitId ? { id: unitId } : {}),
    },
    select: {
      id: true,
      label: true,
      property: { select: { name: true } },
    },
  });

  const unitIds = strUnits.map((u) => u.id);

  if (unitIds.length === 0) {
    return Response.json({
      totalRevenue: 0,
      totalBookings: 0,
      totalNights: 0,
      availableNights: 0,
      occupancyRate: 0,
      averageDailyRate: 0,
      revPAN: 0,
      averageBookingLength: 0,
      revenueByUnit: [],
      revenueByPlatform: [],
      revenueByMonth: [],
    });
  }

  // Get bookings that overlap with the date range (exclude cancelled)
  const bookings = await prisma.booking.findMany({
    where: {
      unitId: { in: unitIds },
      status: { not: "CANCELLED" },
      checkInDate: { lte: end },
      checkOutDate: { gte: start },
    },
    include: {
      unit: {
        select: {
          id: true,
          label: true,
          property: { select: { name: true } },
        },
      },
    },
  });

  // Calculate days in range
  const daysInRange = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const availableNights = daysInRange * unitIds.length;

  // Calculate metrics
  let totalRevenue = 0;
  let totalNights = 0;
  const revenueByUnitMap = new Map<
    string,
    { unitId: string; unitLabel: string; propertyName: string; revenue: number; nights: number }
  >();
  const revenueByPlatformMap = new Map<string, number>();
  const revenueByMonthMap = new Map<string, number>();

  for (const booking of bookings) {
    // Clamp booking dates to the query range
    const effectiveCheckIn = booking.checkInDate < start ? start : booking.checkInDate;
    const effectiveCheckOut = booking.checkOutDate > end ? end : booking.checkOutDate;
    const nights = Math.max(
      0,
      Math.ceil(
        (effectiveCheckOut.getTime() - effectiveCheckIn.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const amount = Number(booking.totalAmount);

    // Proportion of the booking that falls within the range
    const totalBookingNights = Math.max(
      1,
      Math.ceil(
        (booking.checkOutDate.getTime() - booking.checkInDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const proportionalRevenue = (nights / totalBookingNights) * amount;

    totalRevenue += proportionalRevenue;
    totalNights += nights;

    // Revenue by unit
    const unitKey = booking.unit.id;
    const existing = revenueByUnitMap.get(unitKey);
    if (existing) {
      existing.revenue += proportionalRevenue;
      existing.nights += nights;
    } else {
      revenueByUnitMap.set(unitKey, {
        unitId: booking.unit.id,
        unitLabel: booking.unit.label,
        propertyName: booking.unit.property.name,
        revenue: proportionalRevenue,
        nights,
      });
    }

    // Revenue by platform
    const platform = booking.platform || "UNKNOWN";
    revenueByPlatformMap.set(
      platform,
      (revenueByPlatformMap.get(platform) || 0) + proportionalRevenue
    );

    // Revenue by month - attribute to the month of the effective check-in
    const monthKey = `${effectiveCheckIn.getFullYear()}-${String(
      effectiveCheckIn.getMonth() + 1
    ).padStart(2, "0")}`;
    revenueByMonthMap.set(
      monthKey,
      (revenueByMonthMap.get(monthKey) || 0) + proportionalRevenue
    );
  }

  const totalBookings = bookings.length;
  const occupancyRate = availableNights > 0 ? totalNights / availableNights : 0;
  const averageDailyRate = totalNights > 0 ? totalRevenue / totalNights : 0;
  const revPAN = availableNights > 0 ? totalRevenue / availableNights : 0;
  const averageBookingLength =
    totalBookings > 0 ? totalNights / totalBookings : 0;

  const revenueByUnit = Array.from(revenueByUnitMap.values()).map((entry) => ({
    ...entry,
    revenue: Math.round(entry.revenue * 100) / 100,
  }));

  const revenueByPlatform = Array.from(revenueByPlatformMap.entries())
    .map(([platform, revenue]) => ({
      platform,
      revenue: Math.round(revenue * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const revenueByMonth = Array.from(revenueByMonthMap.entries())
    .map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return Response.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalBookings,
    totalNights,
    availableNights,
    occupancyRate: Math.round(occupancyRate * 10000) / 10000,
    averageDailyRate: Math.round(averageDailyRate * 100) / 100,
    revPAN: Math.round(revPAN * 100) / 100,
    averageBookingLength: Math.round(averageBookingLength * 100) / 100,
    revenueByUnit,
    revenueByPlatform,
    revenueByMonth,
  });
}
