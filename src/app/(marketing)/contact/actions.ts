"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { db } from "@/db";
import { inquiries, organization } from "@/db/schema";
import { notify } from "@/server/notify";

const inquirySchema = z.object({
  name: z.string().min(2).max(200),
  email: z.email(),
  company: z.string().max(200).optional().or(z.literal("")),
  interest: z.enum(["hiring", "job-seeking", "partnership", "other"]),
  message: z.string().min(10).max(5000),
});

export type InquiryResult = { ok: true } | { ok: false; error: string };

export async function submitInquiry(input: unknown): Promise<InquiryResult> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form — some fields are missing or invalid." };
  }

  await db.insert(inquiries).values({
    id: randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company || null,
    interest: parsed.data.interest,
    message: parsed.data.message,
  });

  // Single-tenant bridge: while the marketing site belongs to the flagship
  // tenant, route enquiry notifications there. The website-builder phase maps
  // domains to tenants properly.
  const orgs = await db.select({ id: organization.id }).from(organization).limit(2);
  if (orgs.length === 1) {
    notify(orgs[0].id, "inquiry.received", {
      name: parsed.data.name,
      interest: parsed.data.interest,
    });
  }

  return { ok: true };
}
