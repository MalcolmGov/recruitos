import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { organization } from "./auth";

/**
 * Append-only AI-credit ledger. Balance = sum(delta). Monthly allowances are
 * lazily granted (one row per org+period, enforced by the partial unique
 * index), so no scheduler is required.
 */
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    /** positive = grant/top-up, negative = consumption */
    delta: integer("delta").notNull(),
    reason: text("reason", {
      enum: ["monthly_grant", "plan_change", "topup", "consumption", "adjustment"],
    }).notNull(),
    /** YYYY-MM for monthly grants; null otherwise */
    period: text("period"),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("credit_ledger_org_idx").on(t.organizationId, t.createdAt),
    // One monthly grant per org per period.
    uniqueIndex("credit_ledger_monthly_idx")
      .on(t.organizationId, t.period)
      .where(sql`reason = 'monthly_grant'`),
  ],
);
