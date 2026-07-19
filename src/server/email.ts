import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { tenantIntegrations } from "@/db/schema";

/**
 * Transactional email seam.
 * Resolution order: tenant's own Resend integration → platform RESEND_API_KEY
 * env → console log (local dev). Callers never care which path was taken.
 */

type SendEmailInput = {
  organizationId?: string;
  to: string;
  subject: string;
  html: string;
};

type EmailResult = { ok: boolean; via: "tenant-resend" | "platform-resend" | "log" };

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL ?? "RecruitOS <onboarding@resend.dev>";

async function sendViaResend(
  apiKey: string,
  from: string,
  input: SendEmailInput,
): Promise<boolean> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
  });
  if (!response.ok) {
    console.error("[email] resend error", response.status, await response.text());
  }
  return response.ok;
}

export async function sendEmail(input: SendEmailInput): Promise<EmailResult> {
  // 1. Tenant-connected Resend
  if (input.organizationId) {
    const integration = await db.query.tenantIntegrations.findFirst({
      where: and(
        eq(tenantIntegrations.organizationId, input.organizationId),
        eq(tenantIntegrations.type, "resend"),
        eq(tenantIntegrations.enabled, true),
      ),
    });
    if (integration?.config.apiKey) {
      const ok = await sendViaResend(
        integration.config.apiKey,
        integration.config.fromEmail || DEFAULT_FROM,
        input,
      );
      if (ok) return { ok: true, via: "tenant-resend" };
    }
  }

  // 2. Platform-level key
  if (process.env.RESEND_API_KEY) {
    const ok = await sendViaResend(process.env.RESEND_API_KEY, DEFAULT_FROM, input);
    if (ok) return { ok: true, via: "platform-resend" };
  }

  // 3. Local dev: log instead of send
  console.log(`[email:log-only] to=${input.to} subject="${input.subject}"`);
  return { ok: true, via: "log" };
}

export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f5fb;font-family:ui-sans-serif,system-ui,sans-serif;color:#1a1d2e;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#2563eb;color:#ffffff;border-radius:12px 12px 0 0;padding:20px 28px;font-weight:700;font-size:18px;">RecruitOS</div>
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:28px;">
      <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#8a8fa3;font-size:12px;text-align:center;margin-top:16px;">Sent by RecruitOS — a Move Digital platform</p>
  </div>
</body></html>`;
}
