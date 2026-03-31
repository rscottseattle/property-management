import Stripe from "stripe";
import { stripe, PRICE_PRO, PRICE_STR } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

function mapPriceToTier(priceId: string): SubscriptionTier {
  if (priceId === PRICE_STR) return "PRO_STR";
  if (priceId === PRICE_PRO) return "PRO";
  return "FREE";
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error("No userId in subscription metadata", subscriptionId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? mapPriceToTier(priceId) : "PRO";

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscriptionId,
      subscriptionTier: tier,
    },
  });

  console.log(
    `Checkout completed: user=${userId} tier=${tier} subscription=${subscriptionId}`
  );
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error(
      "No userId in subscription metadata",
      subscription.id
    );
    return;
  }

  if (
    subscription.status === "active" ||
    subscription.status === "trialing"
  ) {
    const priceId = subscription.items.data[0]?.price.id;
    const tier = priceId ? mapPriceToTier(priceId) : "PRO";

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier },
    });

    console.log(`Subscription updated: user=${userId} tier=${tier}`);
  } else if (
    subscription.status === "canceled" ||
    subscription.status === "past_due"
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: "FREE" },
    });

    console.log(
      `Subscription ${subscription.status}: user=${userId} tier=FREE`
    );
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error(
      "No userId in subscription metadata",
      subscription.id
    );
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "FREE",
      stripeSubscriptionId: null,
    },
  });

  console.log(`Subscription deleted: user=${userId} tier=FREE`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    console.error(
      "No user found for customer",
      customerId
    );
    return;
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "PAYMENT_FAILED",
      title: "Payment Failed",
      message:
        "Payment failed — please update your payment method",
      link: "/settings?tab=billing",
    },
  });

  console.log(`Payment failed notification created for user=${user.id}`);
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
  }

  return Response.json({ received: true });
}
