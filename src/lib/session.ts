import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Redirects to sign-in when unauthenticated. Use in protected pages/layouts. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

/**
 * Requires an authenticated user with an active organization (tenant).
 * Users without a tenant are sent to onboarding to create/join one.
 */
export async function requireTenant() {
  const session = await requireSession();
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) redirect("/onboarding");
  return { session, organizationId };
}

/**
 * Server-side permission gate backed by the org plugin's access control.
 * Example: await requirePermission({ job: ["create"] })
 */
export async function requirePermission(
  permissions: Record<string, string[]>,
): Promise<void> {
  const ok = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions },
  });
  if (!ok.success) redirect("/dashboard?error=forbidden");
}
