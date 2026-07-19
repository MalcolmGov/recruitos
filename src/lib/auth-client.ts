"use client";

import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, staffRoles } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: staffRoles,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, useActiveOrganization } = authClient;
