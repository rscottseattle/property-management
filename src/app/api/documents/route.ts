import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createDocumentSchema = z.object({
  fileUrl: z.string().min(1, "File URL is required"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  label: z.string().optional(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  leaseId: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const tenantId = searchParams.get("tenantId");
  const leaseId = searchParams.get("leaseId");

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { property: { userId: session.user.id } },
        { tenant: { userId: session.user.id } },
        { unit: { property: { userId: session.user.id } } },
        { lease: { unit: { property: { userId: session.user.id } } } },
      ],
      ...(propertyId ? { propertyId } : {}),
      ...(tenantId ? { tenantId } : {}),
      ...(leaseId ? { leaseId } : {}),
    },
    orderBy: { uploadDate: "desc" },
  });

  return Response.json(documents);
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

  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { propertyId, unitId, tenantId, leaseId, ...rest } = parsed.data;

  // At least one association required
  if (!propertyId && !unitId && !tenantId && !leaseId) {
    return Response.json(
      { error: "At least one association (propertyId, unitId, tenantId, or leaseId) is required" },
      { status: 400 }
    );
  }

  // Verify ownership of associated entities
  if (propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: session.user.id },
    });
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
  }

  if (unitId) {
    const unit = await prisma.unit.findFirst({
      where: { id: unitId, property: { userId: session.user.id } },
    });
    if (!unit) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }
  }

  if (tenantId) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, userId: session.user.id },
    });
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }
  }

  if (leaseId) {
    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        unit: { property: { userId: session.user.id } },
      },
    });
    if (!lease) {
      return Response.json({ error: "Lease not found" }, { status: 404 });
    }
  }

  const document = await prisma.document.create({
    data: {
      ...rest,
      propertyId: propertyId ?? undefined,
      unitId: unitId ?? undefined,
      tenantId: tenantId ?? undefined,
      leaseId: leaseId ?? undefined,
    },
  });

  return Response.json(document, { status: 201 });
}
