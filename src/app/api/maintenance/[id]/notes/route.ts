import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createNoteSchema = z.object({
  content: z.string().min(1, "Content is required"),
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

  // Verify ownership through property
  const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
    where: { id, property: { userId: session.user.id } },
    select: { id: true },
  });

  if (!maintenanceRequest) {
    return Response.json(
      { error: "Maintenance request not found" },
      { status: 404 }
    );
  }

  const notes = await prisma.maintenanceNote.findMany({
    where: { maintenanceRequestId: id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(notes);
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

  // Verify ownership through property
  const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
    where: { id, property: { userId: session.user.id } },
    select: { id: true },
  });

  if (!maintenanceRequest) {
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

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const note = await prisma.maintenanceNote.create({
    data: {
      maintenanceRequestId: id,
      content: parsed.data.content,
    },
  });

  return Response.json(note, { status: 201 });
}
