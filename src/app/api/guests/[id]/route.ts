import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateGuestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  phone: z.string().nullable().optional(),
  platform: z.enum(["AIRBNB", "VRBO", "DIRECT", "OTHER"]).nullable().optional(),
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

  const guest = await prisma.guest.findFirst({
    where: { id, userId: session.user.id },
    include: {
      bookings: {
        include: {
          unit: {
            include: {
              property: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { checkInDate: "desc" },
      },
    },
  });

  if (!guest) {
    return Response.json({ error: "Guest not found" }, { status: 404 });
  }

  return Response.json(guest);
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

  const existing = await prisma.guest.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Guest not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateGuestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const guest = await prisma.guest.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json(guest);
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

  const existing = await prisma.guest.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Guest not found" }, { status: 404 });
  }

  await prisma.guest.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
