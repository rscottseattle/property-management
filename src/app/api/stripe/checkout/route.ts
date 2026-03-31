import { auth } from "@/lib/auth";
import { stripe, getOrCreateCustomer } from "@/lib/stripe";

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

  const { priceId, successUrl, cancelUrl } = body as {
    priceId?: string;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (!priceId || typeof priceId !== "string") {
    return Response.json(
      { error: "priceId is required" },
      { status: 400 }
    );
  }

  const customerId = await getOrCreateCustomer(
    session.user.id,
    session.user.email!,
    session.user.name
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url:
      successUrl ||
      `${appUrl}/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${appUrl}/settings?tab=billing`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
    allow_promotion_codes: true,
  });

  return Response.json({ url: checkoutSession.url });
}
