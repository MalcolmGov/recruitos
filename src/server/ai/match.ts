"use server";

import { randomUUID } from "node:crypto";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { aiMatches, candidates, jobs, type MatchBreakdown } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { requirePermission, requireTenant } from "@/lib/session";
import { chargeAiCredits, refundAiCredits } from "@/server/billing";

import { AI_MODEL, AI_NOT_CONFIGURED_MESSAGE, anthropic, isAiConfigured, logAiUsage } from "./client";

const matchListSchema = z.object({
  matches: z.array(
    z.object({
      candidateId: z.string(),
      score: z.number(),
      skillsFit: z.number(),
      experienceFit: z.number(),
      salaryFit: z.number(),
      locationFit: z.number(),
      availabilityFit: z.number(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      explanation: z.string(),
    }),
  ),
});

export type MatchRow = {
  candidateId: string;
  candidateName: string;
  currentTitle: string | null;
  score: number;
  breakdown: MatchBreakdown;
  explanation: string;
};

export type MatchResult = { ok: true; matches: MatchRow[] } | { ok: false; error: string };

const POOL_LIMIT = 15;

/**
 * Score the active talent pool against a job in a single Claude call.
 * Results are persisted to ai_matches (upsert per job+candidate) so scores
 * are reviewable later. The AI ranks and explains; recruiters decide.
 */
export async function matchCandidatesToJob(jobId: string): Promise<MatchResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ candidate: ["read"], job: ["read"] });

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.organizationId, organizationId)),
    with: { applications: { columns: { candidateId: true } } },
  });
  if (!job) return { ok: false, error: "Job not found." };

  const excluded = job.applications.map((application) => application.candidateId);
  const pool = await db.query.candidates.findMany({
    where: and(
      eq(candidates.organizationId, organizationId),
      eq(candidates.status, "active"),
      excluded.length > 0 ? notInArray(candidates.id, excluded) : undefined,
    ),
    limit: POOL_LIMIT,
  });
  if (pool.length === 0) {
    return { ok: false, error: "No available candidates to match — everyone active is already in this pipeline." };
  }

  const charge = await chargeAiCredits(organizationId, "match");
  if (!charge.ok) return { ok: false, error: charge.error };

  if (!isAiConfigured()) {
    await refundAiCredits(organizationId, "match");
    return { ok: false, error: AI_NOT_CONFIGURED_MESSAGE };
  }


  const jobProfile = {
    title: job.title,
    type: job.type,
    workMode: job.workMode,
    location: job.location,
    salaryRange: { min: job.salaryMin, max: job.salaryMax, currency: job.currency },
    tags: job.tags,
    description: job.description,
  };
  const candidateProfiles = pool.map((candidate) => ({
    candidateId: candidate.id,
    name: candidate.name,
    currentTitle: candidate.currentTitle,
    location: candidate.location,
    skills: candidate.skills,
    salaryExpectation: { amount: candidate.salaryExpectation, currency: candidate.currency },
    ukWorkEligibility: candidate.ukWorkEligibility,
    noticePeriod: candidate.noticePeriod,
  }));

  const prompt = `You are a specialist recruitment matcher for a South African agency placing talent with UK employers.

Score every candidate below against the job. All scores are integers 0-100.
- score: overall placement likelihood weighing all factors
- skillsFit / experienceFit / salaryFit / locationFit / availabilityFit: the factor scores
- salaryFit: compare expectation to the range; expectations inside or below range score high
- availabilityFit: shorter notice periods score higher
- pros / cons: max 3 each, concrete and specific to this candidate
- explanation: 1-2 sentences a recruiter would say to the hiring manager

Return one entry per candidate with the exact candidateId given. Base everything only on the data provided — do not invent facts.

<job>
${JSON.stringify(jobProfile)}
</job>

<candidates>
${JSON.stringify(candidateProfiles)}
</candidates>`;

  try {
    const response = await anthropic().messages.parse({
      model: AI_MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
      output_config: { format: zodOutputFormat(matchListSchema) },
    });

    await logAiUsage(organizationId, "match", response.usage);

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { ok: false, error: "Matching failed — please try again." };
    }

    const byId = new Map(pool.map((candidate) => [candidate.id, candidate]));
    const rows: MatchRow[] = [];
    const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

    for (const match of response.parsed_output.matches) {
      const candidate = byId.get(match.candidateId);
      if (!candidate) continue; // ignore hallucinated ids
      const breakdown: MatchBreakdown = {
        skillsFit: clamp(match.skillsFit),
        experienceFit: clamp(match.experienceFit),
        salaryFit: clamp(match.salaryFit),
        locationFit: clamp(match.locationFit),
        availabilityFit: clamp(match.availabilityFit),
        pros: match.pros.slice(0, 3),
        cons: match.cons.slice(0, 3),
      };
      rows.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        currentTitle: candidate.currentTitle,
        score: clamp(match.score),
        breakdown,
        explanation: match.explanation,
      });
    }
    rows.sort((a, b) => b.score - a.score);

    // Persist scores (replace any previous run for these pairs).
    if (rows.length > 0) {
      await db.delete(aiMatches).where(
        and(
          eq(aiMatches.jobId, job.id),
          inArray(
            aiMatches.candidateId,
            rows.map((row) => row.candidateId),
          ),
        ),
      );
      await db.insert(aiMatches).values(
        rows.map((row) => ({
          id: randomUUID(),
          organizationId,
          jobId: job.id,
          candidateId: row.candidateId,
          score: row.score,
          breakdown: row.breakdown,
          explanation: row.explanation,
          model: AI_MODEL,
        })),
      );
    }

    await recordAudit({
      organizationId,
      actorId: session.user.id,
      action: "ai.matched",
      entityType: "job",
      entityId: job.id,
      metadata: { title: job.title, candidates: rows.length },
    });

    return { ok: true, matches: rows };
  } catch (error) {
    await refundAiCredits(organizationId, "match");
    console.error("[ai] match failed", error);
    return { ok: false, error: "Matching failed — please try again." };
  }
}
