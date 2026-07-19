import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

/**
 * ATS domain tables. Every table is tenant-scoped via organizationId and every
 * query MUST filter on it (see src/lib/session.ts requireTenant).
 *
 * Money is stored as whole units (e.g. 65000 = £65,000; day rates as 550)
 * alongside an explicit currency code — the platform is dual-currency by
 * design (GBP client-side, ZAR internal).
 */

export const HIRING_STAGES = [
  "applied",
  "screening",
  "interview_1",
  "interview_2",
  "technical",
  "references",
  "offer",
  "placed",
  "rejected",
] as const;
export type HiringStage = (typeof HIRING_STAGES)[number];

export const clientCompanies = pgTable(
  "client_companies",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    website: text("website"),
    industry: text("industry"),
    location: text("location"),
    status: text("status", { enum: ["prospect", "active", "dormant"] })
      .default("active")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("client_companies_org_idx").on(t.organizationId)],
);

export const contacts = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    clientCompanyId: text("client_company_id")
      .notNull()
      .references(() => clientCompanies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: text("role"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("contacts_org_company_idx").on(t.organizationId, t.clientCompanyId)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    clientCompanyId: text("client_company_id").references(() => clientCompanies.id, {
      onDelete: "set null",
    }),
    recruiterId: text("recruiter_id").references(() => user.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type", { enum: ["permanent", "contract"] })
      .default("permanent")
      .notNull(),
    workMode: text("work_mode", { enum: ["remote", "hybrid", "onsite"] })
      .default("remote")
      .notNull(),
    location: text("location"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    currency: text("currency").default("GBP").notNull(),
    status: text("status", { enum: ["draft", "open", "closed", "filled"] })
      .default("draft")
      .notNull(),
    /** true = visible on the public job board */
    published: boolean("published").default(false).notNull(),
    closingDate: timestamp("closing_date"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("jobs_org_status_idx").on(t.organizationId, t.status),
    index("jobs_published_idx").on(t.published, t.status),
  ],
);

export const candidates = pgTable(
  "candidates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    location: text("location"),
    currentTitle: text("current_title"),
    skills: jsonb("skills").$type<string[]>().default([]).notNull(),
    salaryExpectation: integer("salary_expectation"),
    currency: text("currency").default("GBP").notNull(),
    ukWorkEligibility: text("uk_work_eligibility", {
      enum: ["remote_no_visa", "visa_held", "visa_required", "uk_citizen"],
    })
      .default("remote_no_visa")
      .notNull(),
    noticePeriod: text("notice_period"),
    source: text("source"),
    status: text("status", { enum: ["active", "placed", "do_not_contact", "archived"] })
      .default("active")
      .notNull(),
    /** POPIA/GDPR: when processing consent was captured; null = not yet consented */
    consentAt: timestamp("consent_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // Duplicate detection: one profile per email per tenant.
    uniqueIndex("candidates_org_email_idx").on(t.organizationId, t.email),
  ],
);

export const applications = pgTable(
  "applications",
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
    stage: text("stage", { enum: HIRING_STAGES }).default("applied").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("applications_job_candidate_idx").on(t.jobId, t.candidateId),
    index("applications_org_job_idx").on(t.organizationId, t.jobId),
  ],
);

export const placements = pgTable(
  "placements",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    recruiterId: text("recruiter_id").references(() => user.id, { onDelete: "set null" }),
    startDate: timestamp("start_date"),
    salary: integer("salary"),
    currency: text("currency").default("GBP").notNull(),
    /** agency fee in feeCurrency, whole units */
    fee: integer("fee"),
    feeCurrency: text("fee_currency").default("GBP").notNull(),
    status: text("status", {
      enum: ["pending_start", "active", "completed", "terminated"],
    })
      .default("pending_start")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("placements_application_idx").on(t.applicationId),
    index("placements_org_created_idx").on(t.organizationId, t.createdAt),
  ],
);

export const clientCompaniesRelations = relations(clientCompanies, ({ many }) => ({
  contacts: many(contacts),
  jobs: many(jobs),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  clientCompany: one(clientCompanies, {
    fields: [contacts.clientCompanyId],
    references: [clientCompanies.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  clientCompany: one(clientCompanies, {
    fields: [jobs.clientCompanyId],
    references: [clientCompanies.id],
  }),
  recruiter: one(user, { fields: [jobs.recruiterId], references: [user.id] }),
  applications: many(applications),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
}));

export const placementsRelations = relations(placements, ({ one }) => ({
  job: one(jobs, { fields: [placements.jobId], references: [jobs.id] }),
  candidate: one(candidates, {
    fields: [placements.candidateId],
    references: [candidates.id],
  }),
  recruiter: one(user, { fields: [placements.recruiterId], references: [user.id] }),
}));
