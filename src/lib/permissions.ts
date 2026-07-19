import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  ownerAc,
  memberAc,
} from "better-auth/plugins/organization/access";

/**
 * RecruitOS access-control statements.
 *
 * Resources map to platform modules; actions are the operations the UI and API
 * expose. Organization-management statements (member, invitation, organization)
 * come from Better Auth's defaults so built-in org flows keep working.
 *
 * Roles model the recruitment desk structure:
 *  - owner / admin: tenant management
 *  - recruiter: 360 recruiter (full desk)
 *  - consultant: candidate consultant (delivery side)
 *  - bd: business development consultant (client side)
 * Client / hiring-manager / candidate portal personas are introduced with their
 * portals in later phases — they authenticate but never receive staff roles.
 */
const statement = {
  ...defaultStatements,
  job: ["create", "read", "update", "delete", "publish", "approve"],
  candidate: ["create", "read", "update", "delete", "export", "merge"],
  client: ["create", "read", "update", "delete"],
  pipeline: ["read", "move", "configure"],
  placement: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
  billing: ["read", "manage"],
  audit: ["read"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
  job: ["create", "read", "update", "delete", "publish", "approve"],
  candidate: ["create", "read", "update", "delete", "export", "merge"],
  client: ["create", "read", "update", "delete"],
  pipeline: ["read", "move", "configure"],
  placement: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
  billing: ["read", "manage"],
  audit: ["read"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  job: ["create", "read", "update", "delete", "publish", "approve"],
  candidate: ["create", "read", "update", "delete", "export", "merge"],
  client: ["create", "read", "update", "delete"],
  pipeline: ["read", "move", "configure"],
  placement: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
  audit: ["read"],
});

export const recruiter = ac.newRole({
  ...memberAc.statements,
  job: ["create", "read", "update", "publish"],
  candidate: ["create", "read", "update", "export"],
  client: ["create", "read", "update"],
  pipeline: ["read", "move"],
  placement: ["create", "read", "update"],
  report: ["read"],
});

export const consultant = ac.newRole({
  ...memberAc.statements,
  job: ["read"],
  candidate: ["create", "read", "update"],
  pipeline: ["read", "move"],
  placement: ["read"],
  report: ["read"],
});

export const bd = ac.newRole({
  ...memberAc.statements,
  job: ["create", "read", "update"],
  candidate: ["read"],
  client: ["create", "read", "update"],
  pipeline: ["read"],
  placement: ["read"],
  report: ["read"],
});

export const staffRoles = { owner, admin, recruiter, consultant, bd };
export type StaffRole = keyof typeof staffRoles;
