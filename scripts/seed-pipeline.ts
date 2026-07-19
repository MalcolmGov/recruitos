/**
 * One-off top-up seed: fills the pipeline boards with a realistic spread of
 * candidates across every non-filled job, at varied stages and with staggered
 * ages so the terminal signals (aging chips, risk, desk value) have texture.
 * Idempotent per candidate email — safe to re-run.
 */
import { randomUUID } from "node:crypto";

import { and, eq, inArray, ne } from "drizzle-orm";

import { db } from "../src/db";
import { applications, candidates, jobs, organization } from "../src/db/schema";

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

type NewCandidate = {
  name: string;
  email: string;
  currentTitle: string;
  location: string;
  skills: string[];
  salaryExpectation: number;
  source: string;
  /** job title substring to attach to */
  jobMatch: string;
  stage:
    | "applied"
    | "screening"
    | "interview_1"
    | "interview_2"
    | "technical"
    | "references"
    | "offer";
  /** days since last movement — drives aging chips and risk signals */
  stageAgeDays: number;
};

const ROSTER: NewCandidate[] = [
  // Customer Success Lead (draft job — board still visible)
  { name: "Naledi Dlamini", email: "naledi@example.dev", currentTitle: "Customer Success Manager", location: "Johannesburg", skills: ["CS Ops", "Gainsight", "Onboarding"], salaryExpectation: 52000, source: "LinkedIn", jobMatch: "Customer Success", stage: "applied", stageAgeDays: 1 },
  { name: "Josh Meyer", email: "josh.meyer@example.dev", currentTitle: "Account Manager", location: "Cape Town", skills: ["Renewals", "Upsell", "CRM"], salaryExpectation: 48000, source: "Job board", jobMatch: "Customer Success", stage: "applied", stageAgeDays: 3 },
  { name: "Zanele Khumalo", email: "zanele@example.dev", currentTitle: "Support Team Lead", location: "Durban", skills: ["Zendesk", "SLAs", "Coaching"], salaryExpectation: 45000, source: "Referral", jobMatch: "Customer Success", stage: "screening", stageAgeDays: 2 },
  { name: "Daniel Botha", email: "daniel.botha@example.dev", currentTitle: "Customer Success Lead", location: "Pretoria", skills: ["QBRs", "Churn analysis", "HubSpot"], salaryExpectation: 55000, source: "Headhunted", jobMatch: "Customer Success", stage: "interview_1", stageAgeDays: 5 },

  // Senior React Engineer (already has 3 — add depth + an offer)
  { name: "Lerato Molefe", email: "lerato@example.dev", currentTitle: "Frontend Engineer", location: "Johannesburg", skills: ["React", "Next.js", "Tailwind"], salaryExpectation: 66000, source: "Job board", jobMatch: "React", stage: "applied", stageAgeDays: 2 },
  { name: "Kyle Naidu", email: "kyle.naidu@example.dev", currentTitle: "Full-stack Developer", location: "Cape Town", skills: ["React", "Node", "Postgres"], salaryExpectation: 72000, source: "LinkedIn", jobMatch: "React", stage: "applied", stageAgeDays: 6 },
  { name: "Amara Osei", email: "amara@example.dev", currentTitle: "Senior UI Engineer", location: "Accra (remote)", skills: ["React", "Design systems", "Storybook"], salaryExpectation: 68000, source: "Referral", jobMatch: "React", stage: "screening", stageAgeDays: 9 },
  { name: "Ben Carter", email: "ben.carter@example.dev", currentTitle: "React Native Developer", location: "Remote (SA)", skills: ["React Native", "TypeScript", "Expo"], salaryExpectation: 64000, source: "Job board", jobMatch: "React", stage: "technical", stageAgeDays: 4 },
  { name: "Priya Reddy", email: "priya.reddy@example.dev", currentTitle: "Senior Frontend Engineer", location: "Durban", skills: ["React", "GraphQL", "Testing Library"], salaryExpectation: 75000, source: "Headhunted", jobMatch: "React", stage: "references", stageAgeDays: 2 },
  { name: "Tomás Silva", email: "tomas@example.dev", currentTitle: "Staff Frontend Engineer", location: "Lisbon (remote)", skills: ["React", "Performance", "Micro-frontends"], salaryExpectation: 82000, source: "LinkedIn", jobMatch: "React", stage: "offer", stageAgeDays: 3 },

  // Management Accountant (has 1 — add spread incl. stalls)
  { name: "Grace Mokoena", email: "grace.m@example.dev", currentTitle: "Assistant Accountant", location: "Johannesburg", skills: ["Sage", "Reconciliation", "VAT"], salaryExpectation: 42000, source: "Job board", jobMatch: "Management Accountant", stage: "applied", stageAgeDays: 4 },
  { name: "Wandile Zulu", email: "wandile@example.dev", currentTitle: "Financial Accountant", location: "Cape Town", skills: ["IFRS", "Caseware", "Excel"], salaryExpectation: 50000, source: "LinkedIn", jobMatch: "Management Accountant", stage: "screening", stageAgeDays: 11 },
  { name: "Chloe van Wyk", email: "chloe@example.dev", currentTitle: "Cost Accountant", location: "Port Elizabeth", skills: ["Costing", "SAP", "Power BI"], salaryExpectation: 47000, source: "Referral", jobMatch: "Management Accountant", stage: "interview_1", stageAgeDays: 8 },
  { name: "Sipho Ndlovu", email: "sipho.n@example.dev", currentTitle: "Management Accountant", location: "Johannesburg", skills: ["CIMA", "Budgeting", "Forecasting"], salaryExpectation: 52000, source: "Headhunted", jobMatch: "Management Accountant", stage: "interview_2", stageAgeDays: 16 },

  // DevOps Engineer (Contract) — was empty of active candidates
  { name: "Marcus Adebayo", email: "marcus@example.dev", currentTitle: "Platform Engineer", location: "Lagos (remote)", skills: ["Kubernetes", "Terraform", "AWS"], salaryExpectation: 0, source: "LinkedIn", jobMatch: "DevOps", stage: "applied", stageAgeDays: 1 },
  { name: "Elena Petrova", email: "elena@example.dev", currentTitle: "SRE", location: "Remote (EU)", skills: ["Prometheus", "GitOps", "Go"], salaryExpectation: 0, source: "Job board", jobMatch: "DevOps", stage: "screening", stageAgeDays: 3 },
  { name: "Ruan Steyn", email: "ruan@example.dev", currentTitle: "DevOps Engineer", location: "Stellenbosch", skills: ["CI/CD", "Docker", "Azure"], salaryExpectation: 0, source: "Referral", jobMatch: "DevOps", stage: "interview_1", stageAgeDays: 2 },
];

async function main() {
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, "meridian-talent"),
  });
  if (!org) throw new Error("Tenant meridian-talent not found — run db:seed first");

  const openJobs = await db.query.jobs.findMany({
    where: and(eq(jobs.organizationId, org.id), ne(jobs.status, "filled")),
    columns: { id: true, title: true },
  });

  const existing = await db.query.candidates.findMany({
    where: and(
      eq(candidates.organizationId, org.id),
      inArray(candidates.email, ROSTER.map((c) => c.email)),
    ),
    columns: { email: true },
  });
  const existingEmails = new Set(existing.map((c) => c.email));

  let added = 0;
  for (const person of ROSTER) {
    if (existingEmails.has(person.email)) continue;
    const job = openJobs.find((j) =>
      j.title.toLowerCase().includes(person.jobMatch.toLowerCase()),
    );
    if (!job) {
      console.warn(`No open job matching "${person.jobMatch}" — skipping ${person.name}`);
      continue;
    }

    const candidateId = randomUUID();
    const appliedAt = daysAgo(person.stageAgeDays + Math.floor(Math.random() * 10) + 3);
    await db.insert(candidates).values({
      id: candidateId,
      organizationId: org.id,
      name: person.name,
      email: person.email,
      currentTitle: person.currentTitle,
      location: person.location,
      skills: person.skills,
      salaryExpectation: person.salaryExpectation || null,
      source: person.source,
      status: "active",
      consentAt: appliedAt,
      createdAt: appliedAt,
      updatedAt: daysAgo(person.stageAgeDays),
    });
    await db.insert(applications).values({
      id: randomUUID(),
      organizationId: org.id,
      jobId: job.id,
      candidateId,
      stage: person.stage,
      createdAt: appliedAt,
      updatedAt: daysAgo(person.stageAgeDays),
    });
    added += 1;
    console.log(`+ ${person.name} → ${job.title} @ ${person.stage} (${person.stageAgeDays}d)`);
  }

  console.log(`\nDone: ${added} candidates added across ${openJobs.length} jobs.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
