import type { IntegrationType } from "@/db/schema";

/**
 * The integrations marketplace catalog. `configurable` entries connect today
 * (per-tenant config in tenant_integrations); `coming_soon` entries require
 * provider app registrations / OAuth credentials and activate as those land.
 */

export type IntegrationCategory =
  | "Job boards"
  | "Communication"
  | "Calendar & meetings"
  | "Finance"
  | "Documents"
  | "Developer";

export type CatalogEntry = {
  key: string;
  name: string;
  category: IntegrationCategory;
  description: string;
} & (
  | {
      status: "configurable";
      type: IntegrationType;
      fields: Array<{ key: string; label: string; placeholder: string; secret?: boolean }>;
    }
  | { status: "coming_soon"; detail: string }
);

export const INTEGRATIONS_CATALOG: CatalogEntry[] = [
  // ------------------------------------------------------------ live now ---
  {
    key: "job_feed",
    name: "Job board feed",
    category: "Job boards",
    description:
      "A standards-based XML/JSON feed of your published jobs — the format Indeed, Google for Jobs aggregators and niche boards ingest.",
    status: "configurable",
    type: "job_feed",
    fields: [],
  },
  {
    key: "resend",
    name: "Resend",
    category: "Communication",
    description: "Send invitations and candidate emails from your own domain.",
    status: "configurable",
    type: "resend",
    fields: [
      { key: "apiKey", label: "API key", placeholder: "re_…", secret: true },
      { key: "fromEmail", label: "From address", placeholder: "Talent Team <talent@yourdomain.com>" },
    ],
  },
  {
    key: "slack",
    name: "Slack",
    category: "Communication",
    description: "Placements, pipeline moves and enquiries posted to a channel.",
    status: "configurable",
    type: "slack_webhook",
    fields: [
      {
        key: "webhookUrl",
        label: "Incoming webhook URL",
        placeholder: "https://hooks.slack.com/services/…",
        secret: true,
      },
    ],
  },
  {
    key: "webhooks",
    name: "Outbound webhooks",
    category: "Developer",
    description: "HMAC-signed JSON events to any endpoint — build on top of RecruitOS.",
    status: "configurable",
    type: "outbound_webhook",
    fields: [
      { key: "url", label: "Endpoint URL", placeholder: "https://your-app.com/hooks/recruitos" },
      { key: "secret", label: "Signing secret", placeholder: "whsec-…", secret: true },
    ],
  },
  // ------------------------------------------------- needs provider setup ---
  {
    key: "linkedin",
    name: "LinkedIn",
    category: "Job boards",
    description: "Post jobs and source candidates from LinkedIn.",
    status: "coming_soon",
    detail: "Requires a LinkedIn Talent Solutions partnership application.",
  },
  {
    key: "indeed",
    name: "Indeed API",
    category: "Job boards",
    description: "Sponsored posts and application ingestion (the free feed above works today).",
    status: "coming_soon",
    detail: "Requires an Indeed publisher/API account.",
  },
  {
    key: "reed",
    name: "Reed",
    category: "Job boards",
    description: "Publish roles to the UK's largest job site.",
    status: "coming_soon",
    detail: "Requires a Reed recruiter account and API key.",
  },
  {
    key: "google-calendar",
    name: "Google Calendar",
    category: "Calendar & meetings",
    description: "Interview scheduling with availability and invites.",
    status: "coming_soon",
    detail: "Requires a Google Cloud OAuth app registration.",
  },
  {
    key: "outlook",
    name: "Microsoft 365 / Outlook",
    category: "Calendar & meetings",
    description: "Calendar sync and email for Microsoft-based teams.",
    status: "coming_soon",
    detail: "Requires an Azure AD app registration.",
  },
  {
    key: "zoom",
    name: "Zoom",
    category: "Calendar & meetings",
    description: "One-click video interview links on every booking.",
    status: "coming_soon",
    detail: "Requires a Zoom Marketplace app.",
  },
  {
    key: "whatsapp",
    name: "WhatsApp (Twilio)",
    category: "Communication",
    description: "Candidate conversations where SA talent actually replies.",
    status: "coming_soon",
    detail: "Requires a Twilio account with WhatsApp sender approval.",
  },
  {
    key: "xero",
    name: "Xero",
    category: "Finance",
    description: "Push placement invoices straight to your ledger.",
    status: "coming_soon",
    detail: "Requires a Xero OAuth app.",
  },
  {
    key: "quickbooks",
    name: "QuickBooks",
    category: "Finance",
    description: "Invoice and revenue sync for QuickBooks shops.",
    status: "coming_soon",
    detail: "Requires an Intuit developer app.",
  },
  {
    key: "docusign",
    name: "DocuSign",
    category: "Documents",
    description: "Send offer letters and contracts for e-signature.",
    status: "coming_soon",
    detail: "Requires a DocuSign developer account.",
  },
];

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  "Job boards",
  "Communication",
  "Calendar & meetings",
  "Finance",
  "Documents",
  "Developer",
];
