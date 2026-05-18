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

    plugins: [
      organization(),
      convex({
        authConfig,
        jwt: {
          definePayload: ({ session, user }) => ({
            orgId: session.activeOrganizationId as string,
            userId: session.userId,
            email: user.email,
            name: user.name,
          }),
        },
      }),
    ],
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
