"use server";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  applications,
  candidates,
  clientCompanies,
  HIRING_STAGES,
  jobs,
  placements,
} from "@/db/schema";
import { STAGE_LABELS } from "@/lib/ats";
import { recordAudit } from "@/lib/audit";
import { requirePermission, requireTenant } from "@/lib/session";
import { notify } from "@/server/notify";

/**
 * ATS server actions. Every action: (1) resolves the tenant from the session,
 * (2) enforces the relevant RBAC permission, (3) scopes all reads/writes to
 * organizationId, (4) writes an audit entry.
 */

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const idSchema = z.string().min(10);

// ---------------------------------------------------------------- clients ---

const clientSchema = z.object({
  name: z.string().min(2).max(200),
  website: z.string().max(300).optional().or(z.literal("")),
  industry: z.string().max(120).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  status: z.enum(["prospect", "active", "dormant"]),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export async function saveClient(input: unknown, clientId?: string): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ client: [clientId ? "update" : "create"] });

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid client details." };
  const values = {
    ...parsed.data,
    website: parsed.data.website || null,
    industry: parsed.data.industry || null,
    location: parsed.data.location || null,
    notes: parsed.data.notes || null,
  };

  let id = clientId;
  if (clientId) {
    const updated = await db
      .update(clientCompanies)
      .set(values)
      .where(
        and(eq(clientCompanies.id, clientId), eq(clientCompanies.organizationId, organizationId)),
      )
      .returning({ id: clientCompanies.id });
    if (updated.length === 0) return { ok: false, error: "Client not found." };
  } else {
    id = randomUUID();
    await db.insert(clientCompanies).values({ id, organizationId, ...values });
  }

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: clientId ? "client.updated" : "client.created",
    entityType: "client",
    entityId: id,
    metadata: { name: values.name },
  });
  revalidatePath("/clients");
  return { ok: true, id };
}

// ------------------------------------------------------------------- jobs ---

const jobSchema = z.object({
  title: z.string().min(2).max(200),
  clientCompanyId: z.string().min(10).optional().or(z.literal("")),
  description: z.string().max(20000).optional().or(z.literal("")),
  type: z.enum(["permanent", "contract"]),
  workMode: z.enum(["remote", "hybrid", "onsite"]),
  location: z.string().max(200).optional().or(z.literal("")),
  salaryMin: z.coerce.number().int().min(0).max(10_000_000).optional().or(z.literal("")),
  salaryMax: z.coerce.number().int().min(0).max(10_000_000).optional().or(z.literal("")),
  currency: z.enum(["GBP", "ZAR", "EUR", "USD"]),
  status: z.enum(["draft", "open", "closed", "filled"]),
  published: z.boolean(),
  tags: z.string().max(500).optional().or(z.literal("")),
});

export async function saveJob(input: unknown, jobId?: string): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ job: [jobId ? "update" : "create"] });

  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid job details." };
  const d = parsed.data;
  const values = {
    title: d.title,
    clientCompanyId: d.clientCompanyId || null,
    description: d.description || null,
    type: d.type,
    workMode: d.workMode,
    location: d.location || null,
    salaryMin: d.salaryMin === "" || d.salaryMin === undefined ? null : d.salaryMin,
    salaryMax: d.salaryMax === "" || d.salaryMax === undefined ? null : d.salaryMax,
    currency: d.currency,
    status: d.status,
    published: d.published,
    tags: d.tags
      ? d.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [],
  };

  let id = jobId;
  if (jobId) {
    const updated = await db
      .update(jobs)
      .set(values)
      .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organizationId)))
      .returning({ id: jobs.id });
    if (updated.length === 0) return { ok: false, error: "Job not found." };
  } else {
    id = randomUUID();
    await db.insert(jobs).values({ id, organizationId, recruiterId: session.user.id, ...values });
  }

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: jobId ? "job.updated" : "job.created",
    entityType: "job",
    entityId: id,
    metadata: { title: values.title, status: values.status },
  });
  if (values.published && values.status === "open") {
    notify(organizationId, "job.published", { title: values.title });
  }
  revalidatePath("/jobs");
  revalidatePath("/browse-jobs");
  return { ok: true, id };
}

// -------------------------------------------------------------- candidates ---

const candidateSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.email(),
  phone: z.string().max(50).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  currentTitle: z.string().max(200).optional().or(z.literal("")),
  skills: z.string().max(1000).optional().or(z.literal("")),
  salaryExpectation: z.coerce.number().int().min(0).max(10_000_000).optional().or(z.literal("")),
  currency: z.enum(["GBP", "ZAR", "EUR", "USD"]),
  ukWorkEligibility: z.enum(["remote_no_visa", "visa_held", "visa_required", "uk_citizen"]),
  noticePeriod: z.string().max(100).optional().or(z.literal("")),
  source: z.string().max(120).optional().or(z.literal("")),
  consent: z.boolean(),
});

export async function saveCandidate(
  input: unknown,
  candidateId?: string,
): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ candidate: [candidateId ? "update" : "create"] });

  const parsed = candidateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid candidate details." };
  const d = parsed.data;
  if (!d.consent) {
    return { ok: false, error: "Processing consent is required (POPIA/GDPR)." };
  }
  const values = {
    name: d.name,
    email: d.email.toLowerCase(),
    phone: d.phone || null,
    location: d.location || null,
    currentTitle: d.currentTitle || null,
    skills: d.skills ? d.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    salaryExpectation:
      d.salaryExpectation === "" || d.salaryExpectation === undefined
        ? null
        : d.salaryExpectation,
    currency: d.currency,
    ukWorkEligibility: d.ukWorkEligibility,
    noticePeriod: d.noticePeriod || null,
    source: d.source || null,
  };

  let id = candidateId;
  if (candidateId) {
    const updated = await db
      .update(candidates)
      .set(values)
      .where(and(eq(candidates.id, candidateId), eq(candidates.organizationId, organizationId)))
      .returning({ id: candidates.id });
    if (updated.length === 0) return { ok: false, error: "Candidate not found." };
  } else {
    // Duplicate detection: unique (org, email).
    const existing = await db.query.candidates.findFirst({
      where: and(
        eq(candidates.organizationId, organizationId),
        eq(candidates.email, values.email),
      ),
      columns: { id: true },
    });
    if (existing) return { ok: false, error: "A candidate with this email already exists." };
    id = randomUUID();
    await db
      .insert(candidates)
      .values({ id, organizationId, consentAt: new Date(), ...values });
  }

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: candidateId ? "candidate.updated" : "candidate.created",
    entityType: "candidate",
    entityId: id,
    metadata: { name: values.name },
  });
  if (!candidateId) notify(organizationId, "candidate.created", { name: values.name });
  revalidatePath("/candidates");
  return { ok: true, id };
}

// ------------------------------------------------------------ applications ---

export async function addToPipeline(input: unknown): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ pipeline: ["move"] });

  const parsed = z.object({ jobId: idSchema, candidateId: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid selection." };

  // Both sides must belong to this tenant.
  const [job, candidate] = await Promise.all([
    db.query.jobs.findFirst({
      where: and(eq(jobs.id, parsed.data.jobId), eq(jobs.organizationId, organizationId)),
      columns: { id: true, title: true },
    }),
    db.query.candidates.findFirst({
      where: and(
        eq(candidates.id, parsed.data.candidateId),
        eq(candidates.organizationId, organizationId),
      ),
      columns: { id: true, name: true },
    }),
  ]);
  if (!job || !candidate) return { ok: false, error: "Job or candidate not found." };

  const existing = await db.query.applications.findFirst({
    where: and(
      eq(applications.jobId, job.id),
      eq(applications.candidateId, candidate.id),
    ),
    columns: { id: true },
  });
  if (existing) return { ok: false, error: "Candidate is already in this pipeline." };

  const id = randomUUID();
  await db.insert(applications).values({
    id,
    organizationId,
    jobId: job.id,
    candidateId: candidate.id,
  });

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: "pipeline.added",
    entityType: "application",
    entityId: id,
    metadata: { job: job.title, candidate: candidate.name },
  });
  revalidatePath("/pipeline");
  return { ok: true, id };
}

export async function moveApplicationStage(input: unknown): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ pipeline: ["move"] });

  const parsed = z
    .object({ applicationId: idSchema, stage: z.enum(HIRING_STAGES) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid move." };

  const application = await db.query.applications.findFirst({
    where: and(
      eq(applications.id, parsed.data.applicationId),
      eq(applications.organizationId, organizationId),
    ),
    with: {
      job: { columns: { id: true, title: true, salaryMax: true, currency: true, recruiterId: true } },
      candidate: { columns: { id: true, name: true } },
    },
  });
  if (!application) return { ok: false, error: "Application not found." };

  await db
    .update(applications)
    .set({ stage: parsed.data.stage })
    .where(eq(applications.id, application.id));

  // Automation: landing in "placed" creates a placement record (idempotent —
  // placements.applicationId is unique).
  if (parsed.data.stage === "placed") {
    await db
      .insert(placements)
      .values({
        id: randomUUID(),
        organizationId,
        applicationId: application.id,
        jobId: application.job.id,
        candidateId: application.candidate.id,
        recruiterId: application.job.recruiterId ?? session.user.id,
        salary: application.job.salaryMax,
        currency: application.job.currency,
      })
      .onConflictDoNothing();
    await db
      .update(candidates)
      .set({ status: "placed" })
      .where(eq(candidates.id, application.candidate.id));
    revalidatePath("/placements");
  }

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: "pipeline.moved",
    entityType: "application",
    entityId: application.id,
    metadata: {
      job: application.job.title,
      candidate: application.candidate.name,
      stage: parsed.data.stage,
    },
  });
  if (parsed.data.stage === "placed") {
    notify(organizationId, "placement.created", {
      candidate: application.candidate.name,
      job: application.job.title,
    });
  } else {
    notify(organizationId, "pipeline.moved", {
      candidate: application.candidate.name,
      job: application.job.title,
      stageLabel: STAGE_LABELS[parsed.data.stage],
    });
  }
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}

// -------------------------------------------------------------- placements ---

const placementUpdateSchema = z.object({
  placementId: idSchema,
  status: z.enum(["pending_start", "active", "completed", "terminated"]),
  startDate: z.string().optional().or(z.literal("")),
  salary: z.coerce.number().int().min(0).optional().or(z.literal("")),
  fee: z.coerce.number().int().min(0).optional().or(z.literal("")),
});

export async function updatePlacement(input: unknown): Promise<ActionResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ placement: ["update"] });

  const parsed = placementUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid placement details." };
  const d = parsed.data;

  const updated = await db
    .update(placements)
    .set({
      status: d.status,
      startDate: d.startDate ? new Date(d.startDate) : null,
      salary: d.salary === "" || d.salary === undefined ? null : d.salary,
      fee: d.fee === "" || d.fee === undefined ? null : d.fee,
    })
    .where(and(eq(placements.id, d.placementId), eq(placements.organizationId, organizationId)))
    .returning({ id: placements.id });
  if (updated.length === 0) return { ok: false, error: "Placement not found." };

  await recordAudit({
    organizationId,
    actorId: session.user.id,
    action: "placement.updated",
    entityType: "placement",
    entityId: d.placementId,
    metadata: { status: d.status },
  });
  revalidatePath("/placements");
  revalidatePath("/dashboard");
  return { ok: true };
}
