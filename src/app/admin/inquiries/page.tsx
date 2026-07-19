import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentInquiries } from "@/server/admin";

export const metadata = { title: "Inquiries · Platform Console" };

const interestLabels: Record<string, string> = {
  hiring: "Hiring talent",
  "job-seeking": "Job seeking",
  partnership: "Partnership",
  other: "Other",
};

export default async function AdminInquiriesPage() {
  const rows = await getRecentInquiries();

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="text-base">Website inquiries</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Contact-form submissions from the marketing site land here.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {rows.map((inquiry) => (
              <li key={inquiry.id} className="space-y-1.5 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{inquiry.name}</span>
                  <span className="text-muted-foreground text-xs">{inquiry.email}</span>
                  {inquiry.company ? (
                    <span className="text-muted-foreground text-xs">· {inquiry.company}</span>
                  ) : null}
                  <Badge variant="secondary" className="ml-auto font-normal">
                    {interestLabels[inquiry.interest] ?? inquiry.interest}
                  </Badge>
                  <span className="text-muted-foreground font-mono text-xs">
                    {inquiry.createdAt.toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {inquiry.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
