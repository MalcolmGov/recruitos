"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { authClient, useSession } from "@/lib/auth-client";

export default function AcceptInvitationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [accepting, setAccepting] = useState(false);

  async function accept() {
    setAccepting(true);
    const { data, error } = await authClient.organization.acceptInvitation({
      invitationId: params.id,
    });
    if (error || !data) {
      setAccepting(false);
      toast.error(error?.message ?? "This invitation is invalid or has expired.");
      return;
    }
    await authClient.organization.setActive({ organizationId: data.invitation.organizationId });
    router.push("/dashboard");
    router.refresh();
  }

  const next = `/accept-invitation/${params.id}`;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-2 font-semibold">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <Flame className="size-4" />
        </span>
        RecruitOS
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Team invitation</CardTitle>
          <CardDescription>
            {session
              ? `Accept this invitation as ${session.user.email}.`
              : "Sign in or create an account to accept this invitation."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPending ? null : session ? (
            <Button className="w-full" onClick={accept} disabled={accepting}>
              {accepting ? "Joining…" : "Accept invitation"}
            </Button>
          ) : (
            <>
              <Button className="w-full" asChild>
                <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/sign-up">Create an account</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
