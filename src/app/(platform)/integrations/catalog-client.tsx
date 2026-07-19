"use client";

import { Check, Copy, Plug, Rss } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { IntegrationType } from "@/db/schema";
import {
  INTEGRATION_CATEGORIES,
  INTEGRATIONS_CATALOG,
  type CatalogEntry,
} from "@/lib/integrations-catalog";
import { cn } from "@/lib/utils";
import { connectJobFeed, saveIntegration, sendTestEvent } from "@/server/settings-actions";

export type ConnectedIntegration = {
  type: IntegrationType;
  enabled: boolean;
  config: Record<string, string>;
};

function ConfigDialog({
  entry,
  connected,
}: {
  entry: Extract<CatalogEntry, { status: "configurable" }>;
  connected?: ConnectedIntegration;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(connected?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const config: Record<string, string> = {};
    for (const field of entry.fields) {
      config[field.key] = String(data.get(field.key) ?? "");
    }
    setSaving(true);
    const result = await saveIntegration({ type: entry.type, enabled, config });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${entry.name} ${connected ? "updated" : "connected"}`);
    setOpen(false);
    router.refresh();
  }

  async function handleTest() {
    setTesting(true);
    const result = await sendTestEvent();
    setTesting(false);
    toast[result.ok ? "success" : "error"](
      result.ok ? "Test event dispatched" : "Test failed",
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={connected?.enabled ? "outline" : "default"} size="sm">
          {connected ? "Manage" : "Connect"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry.name}</DialogTitle>
          <DialogDescription>{entry.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor={`${entry.key}-enabled`} className="font-normal">
              Enabled
            </Label>
            <Switch id={`${entry.key}-enabled`} checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {entry.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`${entry.key}-${field.key}`}>{field.label}</Label>
              <Input
                id={`${entry.key}-${field.key}`}
                name={field.key}
                type={field.secret ? "password" : "text"}
                placeholder={field.placeholder}
                defaultValue={connected?.config[field.key] ?? ""}
                autoComplete="off"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {entry.type !== "resend" && connected?.enabled ? (
              <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? "Sending…" : "Send test"}
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JobFeedDialog({ connected }: { connected?: ConnectedIntegration }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const token = connected?.config.token;
  const xmlUrl = token ? `${baseUrl}/api/feeds/jobs?token=${token}` : null;

  async function handleConnect() {
    setConnecting(true);
    const result = await connectJobFeed();
    setConnecting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Job feed enabled");
    router.refresh();
  }

  function copy(url: string) {
    void navigator.clipboard.writeText(url);
    toast.success("Feed URL copied");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={connected?.enabled ? "outline" : "default"} size="sm">
          {connected?.enabled ? "Manage" : "Connect"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rss className="text-primary size-4" /> Job board feed
          </DialogTitle>
          <DialogDescription>
            Boards and aggregators poll these URLs; only published, open jobs are included.
            The token is the access key — share the URL only with boards you trust.
          </DialogDescription>
        </DialogHeader>
        {connected?.enabled && xmlUrl ? (
          <div className="space-y-3">
            {[
              { label: "XML (Indeed-style)", url: xmlUrl },
              { label: "JSON", url: `${xmlUrl}&format=json` },
            ].map((feed) => (
              <div key={feed.label} className="space-y-1.5">
                <Label>{feed.label}</Label>
                <div className="flex gap-2">
                  <Input readOnly value={feed.url} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Copy ${feed.label} URL`}
                    onClick={() => copy(feed.url)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? "Enabling…" : "Enable feed"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function IntegrationsCatalog({
  connected,
}: {
  connected: ConnectedIntegration[];
}) {
  const [category, setCategory] = useState<string>("All");
  const byType = new Map(connected.map((integration) => [integration.type, integration]));

  const entries = INTEGRATIONS_CATALOG.filter(
    (entry) => category === "All" || entry.category === category,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {["All", ...INTEGRATION_CATEGORIES].map((option) => (
          <button
            key={option}
            onClick={() => setCategory(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              category === option
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => {
          const connection =
            entry.status === "configurable" ? byType.get(entry.type) : undefined;
          const isConnected = Boolean(connection?.enabled);
          return (
            <Card key={entry.key} className={cn("card-lift", entry.status === "coming_soon" && "opacity-80")}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl",
                      isConnected ? "bg-success/12 text-success" : "bg-primary/10 text-primary",
                    )}
                  >
                    {isConnected ? <Check className="size-4.5" /> : <Plug className="size-4.5" />}
                  </span>
                  {isConnected ? (
                    <Badge className="bg-success/12 text-success gap-1 border-0">
                      <span className="bg-success size-1.5 rounded-full" /> Connected
                    </Badge>
                  ) : entry.status === "coming_soon" ? (
                    <Badge variant="secondary">Coming soon</Badge>
                  ) : (
                    <Badge variant="outline">Available</Badge>
                  )}
                </div>
                <CardTitle className="text-base">{entry.name}</CardTitle>
                <p className="text-muted-foreground text-xs">{entry.category}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {entry.description}
                </p>
                {entry.status === "configurable" ? (
                  entry.type === "job_feed" ? (
                    <JobFeedDialog connected={connection} />
                  ) : (
                    <ConfigDialog entry={entry} connected={connection} />
                  )
                ) : (
                  <p className="text-muted-foreground text-xs italic">{entry.detail}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
