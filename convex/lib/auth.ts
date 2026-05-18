import { GenericCtx } from "@convex-dev/better-auth";
import { DataModel } from "../_generated/dataModel";
import { UserIdentity } from "convex/server";
import { checkRolePermission, type PermissionRequest } from "./permissions";
import { getMemberForUser } from "./members";

type AppUserIdentity = UserIdentity & {
  userId: string;
  sessionId: string;
  orgId?: string | null;
  email?: string | null;
};

export async function requireIdentity(ctx: GenericCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) throw new Error("Unauthorised access!");

  return identity as AppUserIdentity;
}

export async function requireOrganization(ctx: GenericCtx<DataModel>) {
  const identity = await requireIdentity(ctx);

  if (!identity.orgId) throw new Error("Unauthorised access!");

  return { orgId: identity.orgId as string, userId: identity.userId };
}

export async function requireMembership(ctx: GenericCtx<DataModel>) {
  const { orgId, userId } = await requireOrganization(ctx);
  const member = await getMemberForUser(ctx, orgId, userId);

  if (!member) {
    throw new Error("You are not a member of this organization.");
  }

  return { orgId, userId, member };
}

export async function requirePermission(
  ctx: GenericCtx<DataModel>,
  permissions: PermissionRequest,
) {
  const { orgId, userId, member } = await requireMembership(ctx);

  if (!checkRolePermission(member.role, permissions)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return { orgId, userId, member };
}
