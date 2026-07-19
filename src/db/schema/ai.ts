import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { organization } from "./auth";
import { candidates, jobs } from "./ats";

/**
 * AI feature tables. ai_usage is the metering backbone for the future
 * AI-credits billing model — every Claude call logs tokens per tenant.
 */

export type MatchBreakdown = {
  skillsFit: number;
  experienceFit: number;
  salaryFit: number;
  locationFit: number;
  availabilityFit: number;
  pros: string[];
  cons: string[];
};

export const aiMatches = pgTable(
  "ai_matches",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    /** 0-100 overall match */
    score: integer("score").notNull(),
    breakdown: jsonb("breakdown").$type<MatchBreakdown>().notNull(),
    explanation: text("explanation").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("ai_matches_job_candidate_idx").on(t.jobId, t.candidateId),
    index("ai_matches_org_job_idx").on(t.organizationId, t.jobId),
  ],
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    feature: text("feature", { enum: ["cv_parse", "match", "copilot"] }).notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("ai_usage_org_created_idx").on(t.organizationId, t.createdAt)],
);

export const aiMatchesRelations = relations(aiMatches, ({ one }) => ({
  job: one(jobs, { fields: [aiMatches.jobId], references: [jobs.id] }),
  candidate: one(candidates, {
    fields: [aiMatches.candidateId],
    references: [candidates.id],
  }),
}));
