import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTenants } from "@/server/admin";

import { TenantActions } from "./tenant-actions";

export const metadata = { title: "Tenants · Platform Console" };

const planVariant = {
  starter: "outline",
  professional: "default",
  enterprise: "secondary",
} as const;

export default async function AdminTenantsPage() {
  const tenants = await getTenants();

  return (
    <Card className="animate-fade-up">
      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Placements</TableHead>
              <TableHead>AI credits</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {tenant.slug} · since{" "}
                    {tenant.createdAt.toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={planVariant[tenant.plan]}>{tenant.plan}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{tenant.members}</TableCell>
                <TableCell className="font-mono text-sm">{tenant.candidates}</TableCell>
                <TableCell className="font-mono text-sm">{tenant.jobs}</TableCell>
                <TableCell className="font-mono text-sm">{tenant.placements}</TableCell>
                <TableCell className="font-mono text-sm">{tenant.creditBalance}</TableCell>
                <TableCell>
                  <TenantActions
                    organizationId={tenant.id}
                    tenantName={tenant.name}
                    currentPlan={tenant.plan}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
