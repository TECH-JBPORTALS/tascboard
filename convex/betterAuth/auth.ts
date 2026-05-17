import { v } from "convex/values";
import { query } from "./_generated/server";

import { createClient, GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { DataModel } from "./_generated/dataModel";
import { betterAuth, BetterAuthOptions } from "better-auth/minimal";
import authConfig from "../auth.config";
import { organization } from "better-auth/plugins";
import authSchema from "./schema";
import { components } from "../_generated/api";

// Better Auth Component
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: { schema: authSchema },
    verbose: false,
  },
);

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "Tascboard",
    baseURL: process.env.SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [organization(), convex({ authConfig })],
  } satisfies BetterAuthOptions;
};

// For `auth` CLI
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});

export const requireAuth = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("Unauthorized access!");

    return identity.subject;
  },
});

/** Verifies `activeOrganizationId` presents in the session and returns or else throws error */
export const requireActiveOrg = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const session = await auth.api.getSession({ headers });

    if (!session?.session.activeOrganizationId)
      throw new Error("No organization is active!");

    return session?.session.activeOrganizationId;
  },
});
