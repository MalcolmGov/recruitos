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
      async sendInvitationEmail(data) {
        const { sendEmail, emailLayout } = await import("../server/email");
        const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        await sendEmail({
          organizationId: data.organization.id,
          to: data.email,
          subject: `You've been invited to ${data.organization.name} on RecruitOS`,
          html: emailLayout(
            `Join ${data.organization.name}`,
            `<p>${data.inviter.user.name} has invited you to join <strong>${data.organization.name}</strong> as a ${data.role}.</p>
             <p style="margin:24px 0;"><a href="${inviteLink}" style="background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Accept invitation</a></p>
             <p style="color:#8a8fa3;font-size:13px;">Or open this link: ${inviteLink}</p>`,
          ),
        });
      },
    }),
    // Must stay last so cookies set inside server actions are applied.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
