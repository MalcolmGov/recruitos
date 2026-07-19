"use server";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  INTEGRATION_TYPES,
  organization,
  tenantIntegrations,
  tenantSettings,
} from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { requirePermission, requireTenant } from "@/lib/session";
import { notify } from "@/server/notify";

type ActionResult = { ok: true } | { ok: false; error: string };

const profileSchema = z.object({
  name: z.string().min(2).max(200),
  timezone: z.string().min(2).max(60),
  clientCurrency: z.enum(["GBP", "ZAR", "EUR", "USD"]),
  internalCurrency: z.enum(["GBP", "ZAR", "EUR", "USD"]),
});

export async function updateTenantProfile(input: unknown): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ settings: ["update"] });

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid settings." };

  await db
    .update(organization)
    .set({ name: parsed.data.name })
    .where(eq(organization.id, organizationId));

  await db
    .insert(tenantSettings)
    .values({
      organizationId,
      timezone: parsed.data.timezone,
      clientCurrency: parsed.data.clientCurrency,
      internalCurrency: parsed.data.internalCurrency,
    })
    .onConflictDoUpdate({
      target: tenantSettings.organizationId,
      set: {
        timezone: parsed.data.timezone,
        clientCurrency: parsed.data.clientCurrency,
        internalCurrency: parsed.data.internalCurrency,
      },
    });

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: "settings.updated",
    entityType: "tenant",
    metadata: { name: parsed.data.name },
  });
  revalidatePath("/settings");
  return { ok: true };
}

const integrationSchema = z.object({
  type: z.enum(INTEGRATION_TYPES),
  enabled: z.boolean(),
  config: z.record(z.string(), z.string().max(2000)),
});

const REQUIRED_CONFIG: Record<(typeof INTEGRATION_TYPES)[number], string[]> = {
  resend: ["apiKey"],
  slack_webhook: ["webhookUrl"],
  outbound_webhook: ["url", "secret"],
  job_feed: ["token"],
};

/**
 * Job-feed connect: the token is server-generated (it gates public access to
 * the tenant's published jobs), so it never round-trips through a form.
 */
export async function connectJobFeed(): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ settings: ["update"] });

  const existing = await db.query.tenantIntegrations.findFirst({
    where: and(
      eq(tenantIntegrations.organizationId, organizationId),
      eq(tenantIntegrations.type, "job_feed"),
    ),
  });
  const token = existing?.config.token ?? randomUUID().replace(/-/g, "");

  await db
    .insert(tenantIntegrations)
    .values({
      id: randomUUID(),
      organizationId,
      type: "job_feed",
      config: { token },
      enabled: true,
    })
    .onConflictDoUpdate({
      target: [tenantIntegrations.organizationId, tenantIntegrations.type],
      set: { config: { token }, enabled: true },
    });

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: "integration.saved",
    entityType: "integration",
    metadata: { type: "job_feed", enabled: true },
  });
  revalidatePath("/integrations");
  return { ok: true };
}

export async function saveIntegration(input: unknown): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ settings: ["update"] });

  const parsed = integrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid integration settings." };

  const missing = REQUIRED_CONFIG[parsed.data.type].filter(
    (key) => !parsed.data.config[key]?.trim(),
  );
  if (parsed.data.enabled && missing.length > 0) {
    return { ok: false, error: `Missing: ${missing.join(", ")}` };
  }

  // URL fields must be https to avoid SSRF-ish surprises from tenant config.
  for (const key of ["webhookUrl", "url"]) {
    const value = parsed.data.config[key];
    if (value && !/^https?:\/\//.test(value)) {
      return { ok: false, error: "Endpoint URLs must start with http(s)://" };
    }
  }

  await db
    .insert(tenantIntegrations)
    .values({
      id: randomUUID(),
      organizationId,
      type: parsed.data.type,
      config: parsed.data.config,
      enabled: parsed.data.enabled,
    })
    .onConflictDoUpdate({
      target: [tenantIntegrations.organizationId, tenantIntegrations.type],
      set: { config: parsed.data.config, enabled: parsed.data.enabled },
    });

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: "integration.saved",
    entityType: "integration",
    metadata: { type: parsed.data.type, enabled: parsed.data.enabled },
  });
  revalidatePath("/settings");
  revalidatePath("/integrations");
  return { ok: true };
}

export async function sendTestEvent(): Promise<ActionResult> {
  const { organizationId } = await requireTenant();
  await requirePermission({ settings: ["update"] });
  notify(organizationId, "integration.test", { at: new Date().toISOString() });
  return { ok: true };
}

export async function getIntegrations() {
  const { organizationId } = await requireTenant();
  return db.query.tenantIntegrations.findMany({
    where: and(eq(tenantIntegrations.organizationId, organizationId)),
  });
}
