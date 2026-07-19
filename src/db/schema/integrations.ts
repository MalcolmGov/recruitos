import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { organization } from "./auth";

/**
 * Per-tenant integration configuration — each tenant connects its own
 * services (white-label model).
 *
 * config shapes by type:
 *  - resend:           { apiKey, fromEmail }
 *  - slack_webhook:    { webhookUrl }
 *  - outbound_webhook: { url, secret }   // HMAC-SHA256 signing secret
 *
 * NOTE: config is stored as plaintext jsonb for local development. Before
 * production deployment these values must be encrypted at rest (KMS/libsodium)
 * — tracked for the deployment phase.
 */
export const INTEGRATION_TYPES = ["resend", "slack_webhook", "outbound_webhook"] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export const tenantIntegrations = pgTable(
  "tenant_integrations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: text("type", { enum: INTEGRATION_TYPES }).notNull(),
    config: jsonb("config").$type<Record<string, string>>().default({}).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("tenant_integrations_org_type_idx").on(t.organizationId, t.type),
    index("tenant_integrations_org_idx").on(t.organizationId),
  ],
);
