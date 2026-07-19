import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { jobs, organization, tenantIntegrations } from "@/db/schema";
import { formatSalaryRange } from "@/lib/ats";

/**
 * Public job feed — the standards-based integration job boards ingest.
 *   GET /api/feeds/jobs?token=…            → Indeed-style XML
 *   GET /api/feeds/jobs?token=…&format=json → JSON
 * The token identifies the tenant and gates access; only published open jobs
 * are ever exposed.
 */

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
  }

  const integration = await db
    .select({
      organizationId: tenantIntegrations.organizationId,
      enabled: tenantIntegrations.enabled,
    })
    .from(tenantIntegrations)
    .where(
      and(
        eq(tenantIntegrations.type, "job_feed"),
        sql`${tenantIntegrations.config}->>'token' = ${token}`,
      ),
    )
    .limit(1);
  if (!integration[0]?.enabled) {
    console.warn("[feed] rejected token", token.slice(0, 6) + "…");
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }
  const { organizationId } = integration[0];

  const [tenant, rows] = await Promise.all([
    db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      columns: { name: true },
    }),
    db.query.jobs.findMany({
      where: and(
        eq(jobs.organizationId, organizationId),
        eq(jobs.published, true),
        eq(jobs.status, "open"),
      ),
      orderBy: [desc(jobs.updatedAt)],
    }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publisher = tenant?.name ?? "RecruitOS";

  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      publisher,
      generatedAt: new Date().toISOString(),
      jobs: rows.map((job) => ({
        id: job.id,
        title: job.title,
        type: job.type,
        workMode: job.workMode,
        location: job.location,
        salary: formatSalaryRange(job.salaryMin, job.salaryMax, job.currency),
        currency: job.currency,
        tags: job.tags,
        description: job.description,
        url: `${baseUrl}/browse-jobs`,
        postedAt: job.createdAt.toISOString(),
      })),
    });
  }

  const items = rows
    .map(
      (job) => `  <job>
    <title><![CDATA[${job.title}]]></title>
    <date><![CDATA[${job.createdAt.toUTCString()}]]></date>
    <referencenumber><![CDATA[${job.id}]]></referencenumber>
    <url><![CDATA[${baseUrl}/browse-jobs]]></url>
    <company><![CDATA[${publisher}]]></company>
    <city><![CDATA[${job.location ?? "Remote"}]]></city>
    <country><![CDATA[GB]]></country>
    <description><![CDATA[${job.description ?? job.title}]]></description>
    <salary><![CDATA[${formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}]]></salary>
    <jobtype><![CDATA[${job.type === "contract" ? "contract" : "fulltime"}]]></jobtype>
    <category><![CDATA[${job.tags.join(", ")}]]></category>
  </job>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<source>
  <publisher>${xmlEscape(publisher)}</publisher>
  <publisherurl>${xmlEscape(baseUrl)}</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</source>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
