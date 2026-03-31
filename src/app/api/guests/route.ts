import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createGuestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  platform: z.enum(["AIRBNB", "VRBO", "DIRECT", "OTHER"]).optional(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (platform) {
    where.platform = platform;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const guests = await prisma.guest.findMany({
    where,
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        select: { checkInDate: true },
        orderBy: { checkInDate: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sort by most recent booking date, falling back to createdAt
  guests.sort((a, b) => {
    const aDate = a.bookings[0]?.checkInDate ?? a.createdAt;
    const bDate = b.bookings[0]?.checkInDate ?? b.createdAt;
    return bDate.getTime() - aDate.getTime();
  });

  // Remove the bookings array used for sorting
  const result = guests.map(({ bookings, ...rest }) => rest);

  return Response.json(result);
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

  const parsed = createGuestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const guest = await prisma.guest.create({
    data: {
      ...data,
      email: data.email || undefined,
      userId: session.user.id,
    },
  });

  return Response.json(guest, { status: 201 });
}
