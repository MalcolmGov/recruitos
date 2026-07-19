"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { IntegrationType } from "@/db/schema";
import { saveIntegration, sendTestEvent } from "@/server/settings-actions";

type IntegrationState = {
  type: IntegrationType;
  enabled: boolean;
  config: Record<string, string>;
};

const CATALOG: Array<{
  type: IntegrationType;
  title: string;
  description: string;
  fields: Array<{ key: string; label: string; placeholder: string; secret?: boolean }>;
}> = [
  {
    type: "resend",
    title: "Resend email",
    description: "Send invitations and notifications from your own Resend account.",
    fields: [
      { key: "apiKey", label: "API key", placeholder: "re_…", secret: true },
      { key: "fromEmail", label: "From address", placeholder: "Meridian <talent@yourdomain.com>" },
    ],
  },
  {
    type: "slack_webhook",
    title: "Slack notifications",
    description: "Placements, pipeline moves and enquiries posted to a Slack channel.",
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
    type: "outbound_webhook",
    title: "Outbound webhook",
    description:
      "JSON events (HMAC-SHA256 signed via x-recruitos-signature) posted to your endpoint.",
    fields: [
      { key: "url", label: "Endpoint URL", placeholder: "https://your-app.com/hooks/recruitos" },
      { key: "secret", label: "Signing secret", placeholder: "whsec-…", secret: true },
    ],
  },
];

function IntegrationCard({
  meta,
  initial,
}: {
  meta: (typeof CATALOG)[number];
  initial?: IntegrationState;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const config: Record<string, string> = {};
    for (const field of meta.fields) {
      config[field.key] = String(data.get(field.key) ?? "");
    }
    setSaving(true);
    const result = await saveIntegration({ type: meta.type, enabled, config });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${meta.title} saved`);
    router.refresh();
  }

  async function handleTest() {
    setTesting(true);
    const result = await sendTestEvent();
    setTesting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Test event dispatched — check your channel/endpoint.");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={`Enable ${meta.title}`} />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {meta.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`${meta.type}-${field.key}`}>{field.label}</Label>
              <Input
                id={`${meta.type}-${field.key}`}
                name={field.key}
                type={field.secret ? "password" : "text"}
                placeholder={field.placeholder}
                defaultValue={initial?.config[field.key] ?? ""}
                autoComplete="off"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {meta.type !== "resend" ? (
              <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? "Sending…" : "Send test event"}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function IntegrationsPanel({ integrations }: { integrations: IntegrationState[] }) {
  const byType = new Map(integrations.map((integration) => [integration.type, integration]));
  return (
    <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
      {CATALOG.map((meta) => (
        <IntegrationCard key={meta.type} meta={meta} initial={byType.get(meta.type)} />
      ))}
    </div>
  );
}
