import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createCommunicationLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  method: z.enum(["CALL", "TEXT", "EMAIL", "IN_PERSON", "OTHER"]),
  note: z.string().min(1, "Note is required"),
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

  const tenant = await prisma.tenant.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!tenant) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  const logs = await prisma.communicationLog.findMany({
    where: { tenantId: id },
    orderBy: { date: "desc" },
  });

  return Response.json(logs);
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

  const tenant = await prisma.tenant.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!tenant) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCommunicationLogSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const log = await prisma.communicationLog.create({
    data: {
      tenantId: id,
      date: new Date(parsed.data.date),
      method: parsed.data.method,
      note: parsed.data.note,
    },
  });

  return Response.json(log, { status: 201 });
}
