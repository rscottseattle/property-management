import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createPropertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  type: z.enum(["LONG_TERM", "SHORT_TERM"]),
  purchasePrice: z.number().optional(),
  purchaseDate: z.string().optional(),
  mortgageAmount: z.number().optional(),
  insuranceCost: z.number().optional(),
  propertyTax: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { userId: session.user.id },
    include: { units: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(properties);
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

  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { purchaseDate, ...rest } = parsed.data;

  const property = await prisma.property.create({
    data: {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      userId: session.user.id,
      units: {
        create: [{ label: "Default" }],
      },
    },
    include: { units: true },
  });

  return Response.json(property, { status: 201 });
}
