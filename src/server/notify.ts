import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { tenantIntegrations } from "@/db/schema";

/**
 * Tenant event dispatcher. Fire-and-forget: notification failures are logged
 * and never break the user-facing operation.
 *
 * Delivery targets per event:
 *  - Slack incoming webhook (human-readable message)
 *  - Outbound webhook (JSON envelope, HMAC-SHA256 signed) — the first brick of
 *    the public API platform: consumers verify x-recruitos-signature.
 */

export type TenantEvent =
  | "candidate.created"
  | "job.published"
  | "pipeline.moved"
  | "placement.created"
  | "inquiry.received"
  | "integration.test";

type EventPayload = Record<string, unknown>;

function slackText(event: TenantEvent, payload: EventPayload): string {
  switch (event) {
    case "placement.created":
      return `:tada: Placement! *${payload.candidate}* placed as *${payload.job}*`;
    case "pipeline.moved":
      return `:arrows_counterclockwise: ${payload.candidate} → *${payload.stageLabel}* (${payload.job})`;
    case "job.published":
      return `:mega: Job published to the board: *${payload.title}*`;
    case "candidate.created":
      return `:bust_in_silhouette: New candidate: *${payload.name}*`;
    case "inquiry.received":
      return `:email: New website enquiry from *${payload.name}* (${payload.interest})`;
    case "integration.test":
      return ":white_check_mark: RecruitOS test event — your integration works.";
  }
}

async function postSlack(webhookUrl: string, text: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) console.error("[notify] slack error", response.status);
}

async function postWebhook(
  url: string,
  secret: string,
  event: TenantEvent,
  payload: EventPayload,
): Promise<void> {
  const body = JSON.stringify({
    id: randomUUID(),
    event,
    payload,
    sentAt: new Date().toISOString(),
  });
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-recruitos-event": event,
      "x-recruitos-signature": `sha256=${signature}`,
    },
    body,
  });
  if (!response.ok) console.error("[notify] webhook error", response.status, url);
}

export function notify(
  organizationId: string,
  event: TenantEvent,
  payload: EventPayload,
): void {
  // Deliberately not awaited by callers — runs after the response.
  void (async () => {
    try {
      const integrations = await db.query.tenantIntegrations.findMany({
        where: and(
          eq(tenantIntegrations.organizationId, organizationId),
          eq(tenantIntegrations.enabled, true),
        ),
      });
      await Promise.allSettled(
        integrations.map((integration) => {
          if (integration.type === "slack_webhook" && integration.config.webhookUrl) {
            return postSlack(integration.config.webhookUrl, slackText(event, payload));
          }
          if (
            integration.type === "outbound_webhook" &&
            integration.config.url &&
            integration.config.secret
          ) {
            return postWebhook(integration.config.url, integration.config.secret, event, payload);
          }
          return Promise.resolve();
        }),
      );
    } catch (error) {
      console.error("[notify] dispatch failed", event, error);
    }
  })();
}
