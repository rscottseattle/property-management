import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, properties, tenants, vendors, guests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        subscriptionTier: true,
        createdAt: true,
      },
    }),
    prisma.property.findMany({
      where: { userId },
      include: {
        units: {
          include: {
            leases: true,
            bookings: true,
          },
        },
        transactions: true,
        maintenanceRequests: {
          include: { notes: true },
        },
      },
    }),
    prisma.tenant.findMany({
      where: { userId },
      include: {
        leases: true,
        communicationLogs: true,
      },
    }),
    prisma.vendor.findMany({
      where: { userId },
    }),
    prisma.guest.findMany({
      where: { userId },
      include: { bookings: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    properties,
    tenants,
    vendors,
    guests,
  };

  const json = JSON.stringify(exportData, null, 2);

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="property-manager-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
