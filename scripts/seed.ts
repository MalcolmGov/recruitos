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
import { member, organization, tenantSettings, user } from "../src/db/schema";
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

async function main() {
  const owner = await ensureUser("Malcolm Govender", "admin@demo.recruitos.dev");
  const recruiter = await ensureUser("Ryan Peters", "recruiter@demo.recruitos.dev");

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

  await db
    .insert(tenantSettings)
    .values({
      organizationId: org.id,
      enabledModules: ["dashboard", "jobs", "candidates", "pipeline", "placements", "clients", "reports"],
    })
    .onConflictDoNothing();

  console.log(`Seeded tenant "${org.name}" with owner + recruiter.`);
  console.log(`Sign in: admin@demo.recruitos.dev / ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
