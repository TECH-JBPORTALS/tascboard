import { query } from "./_generated/server";

import { createClient, GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { DataModel } from "./_generated/dataModel";
import { betterAuth, BetterAuthOptions } from "better-auth/minimal";
import authConfig from "../auth.config";
import { organization } from "better-auth/plugins";
import authSchema from "./schema";
import { components, internal } from "../_generated/api";
import { ac, admin, member, owner } from "../../lib/permissions";

// Better Auth Component
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: { schema: authSchema },
    verbose: false,
  },
);

function runAction(
  ctx: GenericCtx<DataModel>,
  action: typeof internal.emails.processInvitationEmail,
  args: {
    organizationId: string;
    email: string;
    invitationId: string;
    organizationName: string;
    inviterName: string;
  },
) {
  if ("runAction" in ctx && typeof ctx.runAction === "function") {
    return ctx.runAction(action, args);
  }
  throw new Error("Cannot send invitation email in this context.");
}

function runMutation(
  ctx: GenericCtx<DataModel>,
  mutation: typeof internal.employees.ensureProfileAfterInvite,
  args: { organizationId: string; userId: string },
): Promise<unknown>;

function runMutation(
  ctx: GenericCtx<DataModel>,
  mutation: typeof internal.employees.deleteInvitationRecord,
  args: { invitationId: string },
): Promise<unknown>;

function runMutation(
  ctx: GenericCtx<DataModel>,
  mutation:
    | typeof internal.employees.ensureProfileAfterInvite
    | typeof internal.employees.deleteInvitationRecord,
  args: { organizationId: string; userId: string } | { invitationId: string },
) {
  if ("runMutation" in ctx && typeof ctx.runMutation === "function") {
    return ctx.runMutation(mutation, args);
  }
  throw new Error("Cannot run mutation in this context.");
}

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
      organization({
        ac,
        roles: { owner, admin, member },
        async sendInvitationEmail(data) {
          await runAction(ctx, internal.emails.processInvitationEmail, {
            organizationId: data.organization.id,
            email: data.email,
            invitationId: data.id,
            organizationName: data.organization.name,
            inviterName: data.inviter.user.name,
          });
        },
        organizationHooks: {
          afterAcceptInvitation: async ({ invitation, user }) => {
            await runMutation(
              ctx,
              internal.employees.ensureProfileAfterInvite,
              {
                organizationId: invitation.organizationId,
                userId: user.id,
              },
            );

            if ("runMutation" in ctx && typeof ctx.runMutation === "function") {
              await ctx.runMutation(internal.inbox.createInboxItem, {
                organizationId: invitation.organizationId,
                recipientUserId: user.id,
                kind: "system",
                title: "Welcome to the team",
                snippet: "Complete your employee onboarding",
                body: "Fill in your profile, government ID, bank details, and certificates to get started.",
              });
            }
          },
          afterCancelInvitation: async ({ invitation }) => {
            await runMutation(ctx, internal.employees.deleteInvitationRecord, {
              invitationId: invitation.id,
            });
          },
        },
      }),
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
