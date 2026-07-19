import { Bot, Building2, Handshake, Mail, PoundSterling, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformOverview } from "@/server/admin";

export const metadata = { title: "Platform Console" };

export default async function AdminOverviewPage() {
  const overview = await getPlatformOverview();

  const stats = [
    { label: "Tenants", value: String(overview.tenants), icon: Building2 },
    { label: "Users", value: String(overview.users), icon: Users },
    {
      label: "Est. MRR (Professional seats)",
      value: `£${overview.estimatedMrrGbp.toLocaleString("en-GB")}`,
      icon: PoundSterling,
    },
    { label: "Placements (all time)", value: String(overview.placements), icon: Handshake },
    {
      label: "AI calls (30d)",
      value: String(overview.ai30d.calls),
      icon: Bot,
    },
    { label: "Website inquiries", value: String(overview.inquiries), icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-base">Plan distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {(
                [
                  ["Starter", overview.planMix.starter],
                  ["Professional", overview.planMix.professional],
                  ["Enterprise", overview.planMix.enterprise],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-base">AI consumption · 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Input tokens</dt>
                <dd className="font-mono font-semibold">
                  {overview.ai30d.inputTokens.toLocaleString("en-GB")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Output tokens</dt>
                <dd className="font-mono font-semibold">
                  {overview.ai30d.outputTokens.toLocaleString("en-GB")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Model calls</dt>
                <dd className="font-mono font-semibold">{overview.ai30d.calls}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">Newest tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {overview.recentTenants.map((tenant) => (
              <li key={tenant.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{tenant.name}</span>
                <Badge variant="outline" className="font-mono text-xs font-normal">
                  {tenant.createdAt.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
