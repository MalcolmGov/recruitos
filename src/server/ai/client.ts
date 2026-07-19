import "server-only";

import { randomUUID } from "node:crypto";

import Anthropic from "@anthropic-ai/sdk";

import { db } from "@/db";
import { aiUsage } from "@/db/schema";

/**
 * Central Claude access for all AI features.
 * - Model is env-configurable; defaults to Anthropic's most capable Opus tier.
 * - Every call site logs token usage per tenant (the metering backbone for
 *   the AI-credits billing model in Phase 6).
 * - When ANTHROPIC_API_KEY is absent the features degrade with a clear,
 *   user-facing message instead of crashing.
 */

export const AI_MODEL = process.env.RECRUITOS_AI_MODEL ?? "claude-opus-4-8";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const AI_NOT_CONFIGURED_MESSAGE =
  "AI features are not configured yet — add ANTHROPIC_API_KEY to .env.local and restart the server.";

let cachedClient: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic();
  }
  return cachedClient;
}

type UsageLike = { input_tokens: number; output_tokens: number };

export async function logAiUsage(
  organizationId: string,
  feature: "cv_parse" | "match" | "copilot",
  usage: UsageLike,
): Promise<void> {
  try {
    await db.insert(aiUsage).values({
      id: randomUUID(),
      organizationId,
      feature,
      model: AI_MODEL,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    });
  } catch (error) {
    console.error("[ai] failed to log usage", feature, error);
  }
}
