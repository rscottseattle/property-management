import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Notification not found" }, { status: 404 });
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return Response.json(notification);
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

  const existing = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Notification not found" }, { status: 404 });
  }

  await prisma.notification.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
