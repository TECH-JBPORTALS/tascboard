import { GenericCtx } from "@convex-dev/better-auth";
import { DataModel } from "../_generated/dataModel";
import { UserIdentity } from "convex/server";

type AppUserIdentity = UserIdentity & {
  userId: string;
  sessionId: string;
  orgId?: string | null;
};

export async function requireIdentity(ctx: GenericCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) throw new Error("Unauthorised access!");

  return identity as AppUserIdentity;
}

export async function requireOrganization(ctx: GenericCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.orgId) throw new Error("Unauthorised access!");

  return { orgId: identity.orgId as string };
}
