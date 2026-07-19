import { desc, eq } from "drizzle-orm";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { clientCompanies } from "@/db/schema";
import { requireTenant } from "@/lib/session";

import { ClientFormSheet } from "./client-form";

export const metadata = { title: "Clients" };

const statusVariant = {
  active: "default",
  prospect: "secondary",
  dormant: "outline",
} as const;

export default async function ClientsPage() {
  const { organizationId } = await requireTenant();

  const rows = await db.query.clientCompanies.findMany({
    where: eq(clientCompanies.organizationId, organizationId),
    orderBy: [desc(clientCompanies.updatedAt)],
    with: { jobs: { columns: { id: true, status: true } }, contacts: { columns: { id: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
          <p className="text-muted-foreground text-sm">
            {rows.length} client {rows.length === 1 ? "company" : "companies"}
          </p>
        </div>
        <ClientFormSheet />
      </div>

      <Card>
        <CardContent className="pt-2">
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              No clients yet — add your first UK employer.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Open jobs</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.industry ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.location ?? "—"}</TableCell>
                    <TableCell>{row.jobs.filter((job) => job.status === "open").length}</TableCell>
                    <TableCell>{row.contacts.length}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <ClientFormSheet
                        initial={row}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`}>
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
