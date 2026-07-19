import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

/**
 * Platform tables extending Better Auth's organization (= tenant) model.
 * Every tenant-scoped table carries organizationId; queries must always filter
 * by it — cross-tenant reads are a defect, not a feature.
 */

type TenantBranding = {
  logoUrl?: string;
  faviconUrl?: string;
  /** oklch or hex; injected as --primary override for white-labeling */
  primaryColor?: string;
  customDomain?: string;
};

export const tenantSettings = pgTable("tenant_settings", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  branding: jsonb("branding").$type<TenantBranding>().default({}).notNull(),
  timezone: text("timezone").default("Africa/Johannesburg").notNull(),
  locale: text("locale").default("en-ZA").notNull(),
  /** currency clients are billed in (UK employers → GBP) */
  clientCurrency: text("client_currency").default("GBP").notNull(),
  /** currency for internal costs and reporting */
  internalCurrency: text("internal_currency").default("ZAR").notNull(),
  plan: text("plan", { enum: ["starter", "professional", "enterprise"] })
    .default("starter")
    .notNull(),
  /** module keys enabled for this tenant (modular licensing) */
  enabledModules: jsonb("enabled_modules").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    /** before/after snapshots and request context */
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_org_created_idx").on(t.organizationId, t.createdAt),
    index("audit_logs_entity_idx").on(t.organizationId, t.entityType, t.entityId),
  ],
);

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  description: text("description").notNull(),
  defaultEnabled: boolean("default_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenantFeatureFlags = pgTable(
  "tenant_feature_flags",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    flagKey: text("flag_key")
      .notNull()
      .references(() => featureFlags.key, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.flagKey] })],
);

export const tenantSettingsRelations = relations(tenantSettings, ({ one }) => ({
  organization: one(organization, {
    fields: [tenantSettings.organizationId],
    references: [organization.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organization, {
    fields: [auditLogs.organizationId],
    references: [organization.id],
  }),
  actor: one(user, { fields: [auditLogs.actorId], references: [user.id] }),
}));
