"use server";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { requirePermission, requireTenant } from "@/lib/session";

import { AI_MODEL, AI_NOT_CONFIGURED_MESSAGE, anthropic, isAiConfigured, logAiUsage } from "./client";

const parsedCvSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  currentTitle: z.string().nullable(),
  skills: z.array(z.string()),
  yearsExperience: z.number().nullable(),
  noticePeriod: z.string().nullable(),
  salaryExpectation: z.number().nullable(),
  summary: z.string(),
});

export type ParsedCv = z.infer<typeof parsedCvSchema>;

export type CvParseResult =
  | { ok: true; parsed: ParsedCv }
  | { ok: false; error: string };

const MAX_CV_BYTES = 10 * 1024 * 1024;

/**
 * Parse an uploaded CV (PDF or plain text) into a structured candidate draft.
 * The result pre-fills the candidate form — a human reviews and saves; the AI
 * never creates the record directly.
 */
export async function parseCv(formData: FormData): Promise<CvParseResult> {
  const { session, organizationId } = await requireTenant();
  await requirePermission({ candidate: ["create"] });

  if (!isAiConfigured()) return { ok: false, error: AI_NOT_CONFIGURED_MESSAGE };

  const file = formData.get("cv");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (file.size > MAX_CV_BYTES) return { ok: false, error: "CV must be under 10 MB." };

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const instruction =
    "Extract this candidate's profile from their CV. Use null for anything not stated — never invent contact details, salaries or dates. skills: the specific technical and professional skills listed. summary: 2-3 sentences a recruiter would write about this candidate.";

  const content: Array<
    | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
    | { type: "text"; text: string }
  > = [];

  if (isPdf) {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data },
    });
    content.push({ type: "text", text: instruction });
  } else {
    const text = await file.text();
    if (!text.trim()) return { ok: false, error: "The file appears to be empty." };
    content.push({ type: "text", text: `${instruction}\n\n<cv>\n${text}\n</cv>` });
  }

  try {
    const response = await anthropic().messages.parse({
      model: AI_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(parsedCvSchema) },
    });

    await logAiUsage(organizationId, "cv_parse", response.usage);
    await recordAudit({
      organizationId,
      actorId: session.user.id,
      action: "ai.cv_parsed",
      entityType: "candidate",
      metadata: { filename: file.name },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { ok: false, error: "The CV could not be parsed. Try a clearer copy." };
    }
    return { ok: true, parsed: response.parsed_output };
  } catch (error) {
    console.error("[ai] cv parse failed", error);
    return { ok: false, error: "CV parsing failed — please try again." };
  }
}
