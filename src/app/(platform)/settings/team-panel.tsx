"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "recruiter", label: "360 Recruiter" },
  { value: "consultant", label: "Candidate Consultant" },
  { value: "bd", label: "BD Consultant" },
] as const;

type Role = (typeof ROLES)[number]["value"];

export function TeamPanel({
  members,
  invitations,
}: {
  members: { id: string; role: string; name: string; email: string }[];
  invitations: { id: string; email: string; role: string }[];
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [role, setRole] = useState<Role>("recruiter");
  const [sending, setSending] = useState(false);

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    const { error } = await authClient.organization.inviteMember({
      email: String(data.get("email")),
      role,
    });
    setSending(false);
    if (error) {
      toast.error(error.message ?? "Could not send the invitation.");
      return;
    }
    toast.success("Invitation sent");
    setInviteOpen(false);
    router.refresh();
  }

  async function cancelInvite(invitationId: string) {
    const { error } = await authClient.organization.cancelInvitation({ invitationId });
    if (error) {
      toast.error(error.message ?? "Could not cancel the invitation.");
      return;
    }
    toast.success("Invitation cancelled");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Team members</CardTitle>
            <CardDescription>Roles control module permissions (RBAC).</CardDescription>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Invite a team member</DialogTitle>
                <DialogDescription>
                  They&apos;ll receive an email with an acceptance link.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input id="invite-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? "Sending…" : "Send invitation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-muted-foreground text-xs">{row.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.role === "owner" ? "default" : "secondary"}>
                      {row.role}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {invitations.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between text-sm">
                  <span>
                    {invite.email}{" "}
                    <Badge variant="outline" className="ml-1">
                      {invite.role}
                    </Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Cancel invitation for ${invite.email}`}
                    onClick={() => cancelInvite(invite.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
