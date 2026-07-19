"use server";

import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { and, count, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { applications, candidates, jobs, placements } from "@/db/schema";
import { STAGE_LABELS } from "@/lib/ats";
import { requireTenant } from "@/lib/session";
import { chargeAiCredits, refundAiCredits } from "@/server/billing";

import { AI_MODEL, AI_NOT_CONFIGURED_MESSAGE, anthropic, isAiConfigured, logAiUsage } from "./client";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(12),
});

export type CopilotResult = { ok: true; reply: string } | { ok: false; error: string };

const SYSTEM_PROMPT = `You are the RecruitOS copilot — an assistant for recruiters at a South African agency placing talent with UK employers.

You can only see this tenant's data, through the tools provided. Use the tools to answer questions about candidates, jobs, pipelines and placements; never invent records. When the answer depends on data not present in the conversation, call a tool before answering. Amounts are stored as whole units with a currency code (e.g. 65000 GBP).

Be concise and practical: answer first, short supporting detail after. Use plain sentences, not markdown tables. If asked to do something outside your tools (send email, move pipeline stages), explain where in the app to do it.`;

/**
 * One copilot turn: Claude + tenant-scoped read tools in an agentic loop.
 * Tools close over the caller's organizationId, so cross-tenant reads are
 * impossible regardless of what the model asks for.
 */
export async function runCopilot(input: unknown): Promise<CopilotResult> {
  const { organizationId } = await requireTenant();
  const parsed = chatSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid conversation." };

  const charge = await chargeAiCredits(organizationId, "copilot");
  if (!charge.ok) return { ok: false, error: charge.error };

  if (!isAiConfigured()) {
    await refundAiCredits(organizationId, "copilot");
    return { ok: false, error: AI_NOT_CONFIGURED_MESSAGE };
  }


  const searchCandidates = betaZodTool({
    name: "search_candidates",
    description:
      "Search this tenant's candidate pool by name, title or skill. Call this whenever the user asks about candidates, skills availability, or who could fit a role.",
    inputSchema: z.object({
      query: z.string().describe("Name, job title or skill to search for, e.g. 'React'"),
    }),
    run: async ({ query }) => {
      const rows = await db.query.candidates.findMany({
        where: and(
          eq(candidates.organizationId, organizationId),
          or(
            ilike(candidates.name, `%${query}%`),
            ilike(candidates.currentTitle, `%${query}%`),
          ),
        ),
        limit: 10,
      });
      // Also match skills client-side (jsonb array)
      const skillMatches = await db.query.candidates.findMany({
        where: eq(candidates.organizationId, organizationId),
        limit: 100,
      });
      const bySkill = skillMatches.filter((candidate) =>
        candidate.skills.some((skill) => skill.toLowerCase().includes(query.toLowerCase())),
      );
      const seen = new Set<string>();
      const merged = [...rows, ...bySkill].filter((candidate) => {
        if (seen.has(candidate.id)) return false;
        seen.add(candidate.id);
        return true;
      });
      return JSON.stringify(
        merged.slice(0, 10).map((candidate) => ({
          name: candidate.name,
          title: candidate.currentTitle,
          location: candidate.location,
          skills: candidate.skills,
          salaryExpectation: candidate.salaryExpectation,
          currency: candidate.currency,
          noticePeriod: candidate.noticePeriod,
          status: candidate.status,
        })),
      );
    },
  });

  const listJobs = betaZodTool({
    name: "list_jobs",
    description:
      "List this tenant's jobs with status, client and salary. Call this when the user asks about roles, vacancies or what's open.",
    inputSchema: z.object({
      status: z
        .enum(["draft", "open", "closed", "filled", "all"])
        .describe("Filter by job status; use 'all' for everything"),
    }),
    run: async ({ status }) => {
      const rows = await db.query.jobs.findMany({
        where: and(
          eq(jobs.organizationId, organizationId),
          status === "all" ? undefined : eq(jobs.status, status),
        ),
        with: { clientCompany: { columns: { name: true } } },
        limit: 20,
      });
      return JSON.stringify(
        rows.map((job) => ({
          title: job.title,
          client: job.clientCompany?.name,
          type: job.type,
          status: job.status,
          published: job.published,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
        })),
      );
    },
  });

  const pipelineSummary = betaZodTool({
    name: "pipeline_summary",
    description:
      "Get the count of applications per hiring stage plus total placements. Call this for questions about pipeline health, progress or placements.",
    inputSchema: z.object({}),
    run: async () => {
      const [stages, placementCount] = await Promise.all([
        db
          .select({ stage: applications.stage, value: count() })
          .from(applications)
          .where(eq(applications.organizationId, organizationId))
          .groupBy(applications.stage),
        db
          .select({ value: count() })
          .from(placements)
          .where(eq(placements.organizationId, organizationId)),
      ]);
      return JSON.stringify({
        stages: stages.map((row) => ({ stage: STAGE_LABELS[row.stage], count: row.value })),
        totalPlacements: placementCount[0]?.value ?? 0,
      });
    },
  });

  try {
    const finalMessage = await anthropic().beta.messages.toolRunner({
      model: AI_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [searchCandidates, listJobs, pipelineSummary],
      messages: parsed.data.messages,
      max_iterations: 6,
    });

    await logAiUsage(organizationId, "copilot", finalMessage.usage);

    if (finalMessage.stop_reason === "refusal") {
      return { ok: false, error: "The copilot declined that request." };
    }
    const reply = finalMessage.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return { ok: true, reply: reply || "I couldn't produce an answer — try rephrasing." };
  } catch (error) {
    await refundAiCredits(organizationId, "copilot");
    console.error("[ai] copilot failed", error);
    return { ok: false, error: "The copilot hit an error — please try again." };
  }
}
