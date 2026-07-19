/**
 * Development seed: demo tenant + two users.
 *   owner:     admin@demo.recruitos.dev     / recruitos-demo-2026
 *   recruiter: recruiter@demo.recruitos.dev / recruitos-demo-2026
 *
 * Idempotent — safe to re-run. Run with: pnpm db:seed
 */
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "../src/db";
import {
  applications,
  candidates,
  clientCompanies,
  contacts,
  jobs,
  member,
  organization,
  placements,
  tenantSettings,
  user,
} from "../src/db/schema";
import { auth } from "../src/lib/auth";

const DEMO_PASSWORD = "recruitos-demo-2026";
const ORG_SLUG = "meridian-talent";

async function ensureUser(name: string, email: string) {
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) return existing;
  // Sign-up API hashes the password with better-auth's own scheme.
  await auth.api.signUpEmail({ body: { name, email, password: DEMO_PASSWORD } });
  const created = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (!created) throw new Error(`Failed to create user ${email}`);
  return created;
}

async function ensureMembership(organizationId: string, userId: string, role: string) {
  const existing = await db.query.member.findFirst({
    where: (fields, { and, eq: equals }) =>
      and(equals(fields.organizationId, organizationId), equals(fields.userId, userId)),
  });
  if (existing) return;
  await db.insert(member).values({
    id: randomUUID(),
    organizationId,
    userId,
    role,
    createdAt: new Date(),
  });
}

async function ensureUserWithPassword(name: string, email: string, password: string) {
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) return existing;
  await auth.api.signUpEmail({ body: { name, email, password } });
  const created = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (!created) throw new Error(`Failed to create user ${email}`);
  return created;
}

async function main() {
  const owner = await ensureUser("Malcolm Govender", "admin@demo.recruitos.dev");
  const recruiter = await ensureUser("Ryan Peters", "recruiter@demo.recruitos.dev");
  // Simple local-dev login (owner role): malcolm@recruitos.dev / password123
  const malcolm = await ensureUserWithPassword("Malcolm", "malcolm@recruitos.dev", "password123");

  let org = await db.query.organization.findFirst({
    where: eq(organization.slug, ORG_SLUG),
  });
  if (!org) {
    const [created] = await db
      .insert(organization)
      .values({
        id: randomUUID(),
        name: "Meridian Talent Partners",
        slug: ORG_SLUG,
        createdAt: new Date(),
      })
      .returning();
    org = created;
  }

  await ensureMembership(org.id, owner.id, "owner");
  await ensureMembership(org.id, recruiter.id, "recruiter");
  await ensureMembership(org.id, malcolm.id, "owner");

  await db
    .insert(tenantSettings)
    .values({
      organizationId: org.id,
      enabledModules: ["dashboard", "jobs", "candidates", "pipeline", "placements", "clients", "reports"],
    })
    .onConflictDoNothing();

  await seedAts(org.id, recruiter.id);

  console.log(`Seeded tenant "${org.name}" with owner + recruiter.`);
  console.log(`Sign in: admin@demo.recruitos.dev / ${DEMO_PASSWORD}`);
  process.exit(0);
}

/** Recruitment sample data — skipped if the tenant already has jobs. */
async function seedAts(organizationId: string, recruiterId: string) {
  const existing = await db.query.jobs.findFirst({
    where: eq(jobs.organizationId, organizationId),
    columns: { id: true },
  });
  if (existing) return;

  const clientRows = [
    { name: "Northgate Systems", industry: "Technology", location: "London, UK", website: "https://northgate.example" },
    { name: "Albion Health", industry: "Healthcare", location: "Manchester, UK", website: "https://albion.example" },
    { name: "Fintrust Capital", industry: "Financial Services", location: "London, UK", website: "https://fintrust.example" },
  ].map((row) => ({ id: randomUUID(), organizationId, status: "active" as const, ...row }));
  await db.insert(clientCompanies).values(clientRows);

  await db.insert(contacts).values([
    { id: randomUUID(), organizationId, clientCompanyId: clientRows[0].id, name: "Sarah Whitfield", email: "sarah@northgate.example", role: "VP Engineering" },
    { id: randomUUID(), organizationId, clientCompanyId: clientRows[1].id, name: "David Okafor", email: "david@albion.example", role: "Finance Director" },
    { id: randomUUID(), organizationId, clientCompanyId: clientRows[2].id, name: "James O'Connell", email: "james@fintrust.example", role: "Programme Director" },
  ]);

  const jobRows = [
    {
      id: randomUUID(), organizationId, clientCompanyId: clientRows[0].id, recruiterId,
      title: "Senior React Engineer", type: "permanent" as const, workMode: "remote" as const,
      location: "London (remote from SA)", salaryMin: 65000, salaryMax: 80000, currency: "GBP",
      status: "open" as const, published: true, tags: ["React", "TypeScript", "Next.js"],
      description: "Product-led fintech building consumer savings tools. React 19, TypeScript, Next.js.",
    },
    {
      id: randomUUID(), organizationId, clientCompanyId: clientRows[1].id, recruiterId,
      title: "Management Accountant", type: "permanent" as const, workMode: "remote" as const,
      location: "Manchester (remote from SA)", salaryMin: 45000, salaryMax: 55000, currency: "GBP",
      status: "open" as const, published: true, tags: ["CIMA", "FP&A", "Excel"],
      description: "Group reporting and FP&A for a private-equity-backed healthcare group.",
    },
    {
      id: randomUUID(), organizationId, clientCompanyId: clientRows[2].id, recruiterId,
      title: "DevOps Engineer (Contract)", type: "contract" as const, workMode: "remote" as const,
      location: "Remote (UK client)", salaryMin: 450, salaryMax: 550, currency: "GBP",
      status: "open" as const, published: true, tags: ["AWS", "Kubernetes", "Terraform"],
      description: "6-month AWS/Kubernetes migration for a retail platform. Outside IR35.",
    },
    {
      id: randomUUID(), organizationId, clientCompanyId: clientRows[0].id, recruiterId,
      title: "Customer Success Lead", type: "permanent" as const, workMode: "hybrid" as const,
      location: "London (hybrid options)", salaryMin: 50000, salaryMax: 60000, currency: "GBP",
      status: "draft" as const, published: false, tags: ["SaaS", "Enterprise"],
      description: "Own enterprise renewals and expansion for a B2B SaaS scale-up.",
    },
  ];
  await db.insert(jobs).values(jobRows);

  const candidateRows = [
    { name: "Thandi Mokoena", email: "thandi@example.dev", currentTitle: "Data Engineer", location: "Johannesburg", skills: ["Python", "Airflow", "SQL"], salaryExpectation: 62000, ukWorkEligibility: "remote_no_visa" as const, noticePeriod: "30 days", source: "Referral" },
    { name: "Pieter van der Merwe", email: "pieter@example.dev", currentTitle: "Senior React Developer", location: "Cape Town", skills: ["React", "TypeScript", "GraphQL"], salaryExpectation: 70000, ukWorkEligibility: "remote_no_visa" as const, noticePeriod: "60 days", source: "LinkedIn" },
    { name: "Ayesha Patel", email: "ayesha@example.dev", currentTitle: "Management Accountant", location: "Durban", skills: ["CIMA", "Sage", "Power BI"], salaryExpectation: 48000, ukWorkEligibility: "remote_no_visa" as const, noticePeriod: "30 days", source: "Job board" },
    { name: "Sipho Dlamini", email: "sipho@example.dev", currentTitle: "DevOps Engineer", location: "Pretoria", skills: ["AWS", "Kubernetes", "Terraform"], salaryExpectation: 500, ukWorkEligibility: "remote_no_visa" as const, noticePeriod: "Immediate", source: "Database" },
    { name: "Emma Botha", email: "emma@example.dev", currentTitle: "Customer Success Manager", location: "Cape Town", skills: ["SaaS", "Renewals", "Onboarding"], salaryExpectation: 52000, ukWorkEligibility: "visa_held" as const, noticePeriod: "30 days", source: "Referral" },
  ].map((row) => ({
    id: randomUUID(), organizationId, currency: "GBP", consentAt: new Date(), ...row,
  }));
  await db.insert(candidates).values(candidateRows);

  const apps = [
    { jobId: jobRows[0].id, candidateId: candidateRows[1].id, stage: "interview_2" as const },
    { jobId: jobRows[0].id, candidateId: candidateRows[0].id, stage: "screening" as const },
    { jobId: jobRows[1].id, candidateId: candidateRows[2].id, stage: "offer" as const },
    { jobId: jobRows[2].id, candidateId: candidateRows[3].id, stage: "placed" as const },
    { jobId: jobRows[0].id, candidateId: candidateRows[4].id, stage: "applied" as const },
  ].map((row) => ({ id: randomUUID(), organizationId, ...row }));
  await db.insert(applications).values(apps);

  await db.insert(placements).values({
    id: randomUUID(),
    organizationId,
    applicationId: apps[3].id,
    jobId: jobRows[2].id,
    candidateId: candidateRows[3].id,
    recruiterId,
    salary: 520,
    currency: "GBP",
    fee: 15600,
    feeCurrency: "GBP",
    status: "active",
    startDate: new Date("2026-07-01"),
  });

  console.log("Seeded ATS sample data (3 clients, 4 jobs, 5 candidates, 5 applications, 1 placement).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
