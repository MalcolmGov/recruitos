import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { recordAudit } from "@/lib/audit";
import { applyPlanChange } from "@/server/billing";

/**
 * Stripe webhook — ⚠️ UNTESTED (no Stripe keys in this environment); verify
 * end-to-end in Stripe test mode before going live. Register the endpoint for
 * checkout.session.completed and set STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }

  const { stripe, planFromCheckoutSession } = await import("@/server/stripe");
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("[billing] stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  console.log("[billing] stripe webhook received", event.type);

  if (event.type === "checkout.session.completed") {
    const target = planFromCheckoutSession(event.data.object);
    if (target) {
      await applyPlanChange(target.organizationId, target.plan);
      await recordAudit({
        organizationId: target.organizationId,
        action: "billing.plan_changed",
        entityType: "tenant",
        metadata: { plan: target.plan, mode: "stripe" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
