import "server-only";

import Stripe from "stripe";

import { PLANS, type PlanId } from "@/lib/plans";

/**
 * Stripe adapter — ⚠️ UNTESTED: written against the current Stripe API but
 * never run, because no STRIPE_SECRET_KEY exists in this environment. Before
 * first live use: create Products/Prices in the Stripe dashboard, set
 * STRIPE_PRICE_PROFESSIONAL / STRIPE_PRICE_ENTERPRISE, STRIPE_WEBHOOK_SECRET,
 * and test the full checkout → webhook → applyPlanChange loop in test mode.
 */

let cachedStripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!cachedStripe) {
    cachedStripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }
  return cachedStripe;
}

const PRICE_ENV: Partial<Record<PlanId, string | undefined>> = {
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

export async function createCheckoutForPlan(
  organizationId: string,
  plan: PlanId,
): Promise<string> {
  const priceId = PRICE_ENV[plan];
  if (!priceId) throw new Error(`No Stripe price configured for plan ${plan}`);

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?checkout=cancelled`,
    metadata: { organizationId, plan },
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

export function planFromCheckoutSession(
  session: Stripe.Checkout.Session,
): { organizationId: string; plan: PlanId } | null {
  const organizationId = session.metadata?.organizationId;
  const plan = session.metadata?.plan as PlanId | undefined;
  if (!organizationId || !plan || !(plan in PLANS)) return null;
  return { organizationId, plan };
}
