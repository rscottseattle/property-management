import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function findOwnedDocument(documentId: string, userId: string) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      OR: [
        { property: { userId } },
        { tenant: { userId } },
        { unit: { property: { userId } } },
        { lease: { unit: { property: { userId } } } },
      ],
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await findOwnedDocument(id, session.user.id);

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  return Response.json(document);
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

  const existing = await findOwnedDocument(id, session.user.id);

  if (!existing) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  await prisma.document.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
