/**
 * Modular licensing: every tenant is on a plan; plans bundle modules, seats
 * and a monthly AI-credit allowance. This file is the single source of truth
 * consumed by billing, module gating and the pricing UI.
 */

export type PlanId = "starter" | "professional" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  description: string;
  seats: number | null; // null = unlimited
  monthlyAiCredits: number;
  modules: string[];
  highlighted?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceLabel: "Free",
    description: "Core ATS for a small desk.",
    seats: 3,
    monthlyAiCredits: 25,
    modules: ["dashboard", "jobs", "candidates", "pipeline", "placements", "clients", "settings"],
  },
  professional: {
    id: "professional",
    name: "Professional",
    priceLabel: "£49 / user / month",
    description: "Full recruitment platform with AI.",
    seats: 25,
    monthlyAiCredits: 500,
    modules: [
      "dashboard",
      "jobs",
      "candidates",
      "pipeline",
      "placements",
      "clients",
      "reports",
      "ai",
      "integrations",
      "settings",
    ],
    highlighted: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    description: "White-label, API access, custom AI and SLAs.",
    seats: null,
    monthlyAiCredits: 2000,
    modules: [
      "dashboard",
      "jobs",
      "candidates",
      "pipeline",
      "placements",
      "clients",
      "reports",
      "ai",
      "integrations",
      "api",
      "white-label",
      "settings",
    ],
  },
};

/** Credits charged per AI action — simple, communicable pricing. */
export const AI_CREDIT_COSTS = {
  cv_parse: 2,
  match: 5,
  copilot: 1,
} as const;

export type AiFeature = keyof typeof AI_CREDIT_COSTS;
