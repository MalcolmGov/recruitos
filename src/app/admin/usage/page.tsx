import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAiUsageByTenant } from "@/server/admin";

export const metadata = { title: "AI usage · Platform Console" };

const featureLabels: Record<string, string> = {
  cv_parse: "CV parsing",
  match: "AI matching",
  copilot: "Copilot",
};

export default async function AdminUsagePage() {
  const rows = await getAiUsageByTenant();

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="text-base">AI usage by tenant · last 30 days</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No AI calls recorded yet — usage appears here as tenants use CV parsing, matching
            and the copilot.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Input tokens</TableHead>
                <TableHead className="text-right">Output tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.organizationId}-${row.feature}`}>
                  <TableCell className="font-medium">{row.tenant}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {featureLabels[row.feature] ?? row.feature}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{row.calls}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.inputTokens.toLocaleString("en-GB")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.outputTokens.toLocaleString("en-GB")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
