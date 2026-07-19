import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "./session";

/**
 * Platform-owner (Move Digital) access — deliberately separate from tenant
 * RBAC. Admins are allowlisted by email via PLATFORM_ADMIN_EMAILS
 * (comma-separated). Upgrade path: Better Auth admin plugin with a proper
 * platform-role once operator accounts multiply.
 */

function adminEmails(): Set<string> {
  return new Set(
    (process.env.PLATFORM_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isPlatformAdminEmail(email: string): boolean {
  return adminEmails().has(email.toLowerCase());
}

/** Gate for /admin — non-admins land back on their tenant dashboard. */
export async function requirePlatformAdmin() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin");
  if (!isPlatformAdminEmail(session.user.email)) redirect("/dashboard");
  return session;
}
