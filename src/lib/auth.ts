import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { member } from "../db/schema";
import { ac, staffRoles } from "./permissions";

export const auth = betterAuth({
  appName: "RecruitOS",
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Land users in their tenant on login: default the active organization
        // to their first membership.
        before: async (session) => {
          const membership = await db.query.member.findFirst({
            where: eq(member.userId, session.userId),
          });
          return {
            data: { ...session, activeOrganizationId: membership?.organizationId ?? null },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      ac,
      roles: staffRoles,
      organizationLimit: 1,
      // Invitation emails are wired up with Resend in the communications phase;
      // until then invites are created and accepted in-app.
      async sendInvitationEmail() {},
    }),
    // Must stay last so cookies set inside server actions are applied.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
