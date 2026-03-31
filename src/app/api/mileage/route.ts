import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const IRS_MILEAGE_RATE = 0.7; // 2026 standard rate

const MILEAGE_PAYEE = "__mileage__";

const createMileageSchema = z.object({
  date: z.string().min(1, "Date is required"),
  distance: z.number().positive("Distance must be positive"),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  propertyId: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const mileageTransactions = await prisma.transaction.findMany({
    where: {
      property: { userId: session.user.id },
      payee: MILEAGE_PAYEE,
      category: "auto_and_travel",
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    },
    include: {
      property: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  const entries = mileageTransactions.map((t) => {
    let details: {
      distance?: number;
      fromLocation?: string;
      toLocation?: string;
      purpose?: string;
    } = {};
    try {
      details = JSON.parse(t.notes ?? "{}");
    } catch {
      // notes may not be valid JSON
    }

    return {
      id: t.id,
      date: t.date,
      distance: details.distance ?? 0,
      fromLocation: details.fromLocation ?? null,
      toLocation: details.toLocation ?? null,
      purpose: details.purpose ?? null,
      amount: Number(t.amount),
      propertyId: t.propertyId,
      propertyName: t.property.name,
    };
  });

  return Response.json(entries);
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

  const parsed = createMileageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { date, distance, fromLocation, toLocation, purpose, propertyId } =
    parsed.data;

  // Resolve the property — use provided or fall back to user's first property
  let resolvedPropertyId = propertyId;
  if (resolvedPropertyId) {
    const property = await prisma.property.findFirst({
      where: { id: resolvedPropertyId, userId: session.user.id },
    });
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
  } else {
    const firstProperty = await prisma.property.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!firstProperty) {
      return Response.json(
        { error: "No property found. Create a property first." },
        { status: 400 }
      );
    }
    resolvedPropertyId = firstProperty.id;
  }

  const amount = distance * IRS_MILEAGE_RATE;

  const transaction = await prisma.transaction.create({
    data: {
      propertyId: resolvedPropertyId,
      type: "EXPENSE",
      category: "auto_and_travel",
      amount,
      date: new Date(date),
      payee: MILEAGE_PAYEE,
      notes: JSON.stringify({ distance, fromLocation, toLocation, purpose }),
      status: "COMPLETED",
    },
    include: {
      property: { select: { name: true } },
    },
  });

  return Response.json(
    {
      id: transaction.id,
      date: transaction.date,
      distance,
      fromLocation: fromLocation ?? null,
      toLocation: toLocation ?? null,
      purpose,
      amount: Number(transaction.amount),
      propertyId: transaction.propertyId,
      propertyName: transaction.property.name,
    },
    { status: 201 }
  );
}
