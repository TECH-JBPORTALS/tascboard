import { createClient, GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import {
  requireActionCtx,
  requireMutationCtx,
} from '@convex-dev/better-auth/utils'
import { BetterAuthOptions, betterAuth } from 'better-auth/minimal'
import { organization } from 'better-auth/plugins'
import { v } from 'convex/values'
import { ac, employee, owner } from '../lib/permissions'
import { components, internal } from './_generated/api'
import { DataModel } from './_generated/dataModel'
import { internalAction, mutation, query } from './_generated/server'
import authConfig from './auth.config'
import authSchema, { vv } from './schema'

// Better Auth Component
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: { schema: authSchema },
    verbose: false,
  },
)

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: 'Tascboard',
    baseURL: {
      allowedHosts: ['localhost:3000', '*.vercel.app', '*.convex.site'],
      fallback: process.env.SITE_URL!,
    },
    trustedOrigins: ['*.vercel.app', '*.convex.site'],
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      async sendVerificationEmail({ user, url }) {
        const actoinCtx = requireActionCtx(ctx)
        await actoinCtx.runAction(internal.emails.processVerificationEmail, {
          email: user.email,
          verificationUrl: url,
        })
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    plugins: [
      organization({
        ac,
        roles: { owner, employee },
        async sendInvitationEmail(data) {
          const actionCtx = requireActionCtx(ctx)
          await actionCtx.runAction(internal.emails.processInvitationEmail, {
            organizationId: data.organization.id,
            email: data.email,
            invitationId: data.id,
            organizationName: data.organization.name,
            inviterName: data.inviter.user.name,
          })
        },
        organizationHooks: {
          afterCreateOrganization: async ({ organization }) => {
            const mutationCtx = requireMutationCtx(ctx)
            await mutationCtx.runMutation(
              internal.organizationSettings.ensureWorkSchedule,
              { organizationId: organization.id },
            )
          },
          afterAcceptInvitation: async ({ invitation, user }) => {
            const mutationCtx = requireMutationCtx(ctx)
            await mutationCtx.runMutation(
              internal.employeeProfiles.ensureProfileAfterInvite,
              { organizationId: invitation.organizationId, userId: user.id },
            )

            await mutationCtx.runMutation(internal.inbox.createInboxItem, {
              organizationId: invitation.organizationId,
              recipientUserId: user.id,
              kind: 'onboarding',
              title: 'Complete your employee profile',
              snippet:
                'A few details to get you started — takes about 5 minutes',
              body: 'Welcome aboard. Complete your profile below so payroll, compliance, and your team have what they need.',
            })
          },
          afterCancelInvitation: async ({ invitation }) => {
            const mutationCtx = requireMutationCtx(ctx)
            await mutationCtx.runMutation(
              components.betterAuth.adapter.deleteOne,
              {
                input: {
                  model: 'invitation',
                  where: [
                    { field: '_id', operator: 'eq', value: invitation.id },
                  ],
                },
              },
            )
          },
        },
        schema: {
          member: {
            modelName: 'employee',
            additionalFields: {
              active: {
                type: 'boolean',
                defaultValue: true,
                required: true,
                index: true,
                input: true,
              },
            },
          },
        },
      }),
      convex({
        authConfig,
        jwt: {
          /** Customized convex auth payload */
          definePayload: ({ session, user }) => ({
            activeOrganizationId: session.activeOrganizationId,
            userId: session.userId,
            email: user.email,
            name: user.name,
          }),
        },
      }),
    ],
  } satisfies BetterAuthOptions
}

// For `auth` CLI
export const options = createAuthOptions({} as GenericCtx<DataModel>)

export const { getAuthUser } = authComponent.clientApi()

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx))
}

export const listOrganizations = query(async (ctx) => {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

  const organizations = await auth.api.listOrganizations({ headers })

  return organizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    metadata: organization.metadata,
  }))
})

export const getActiveOrganization = query(async (ctx) => {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

  return await auth.api.getFullOrganization({ headers })
})

export const setActiveOrganization = mutation({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    return await auth.api.setActiveOrganization({
      headers,
      body: { organizationId: args.organizationId },
    })
  },
})

export const getActiveMemberRole = query({
  args: {},
  returns: v.union(v.object({ role: v.string() }), v.null()),
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    return await auth.api.getActiveMemberRole({ headers })
  },
})

export const createAccount = internalAction({
  args: {
    email: vv.string(),
    password: vv.string(),
    name: vv.string(),
    image: vv.optional(vv.string()),
  },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const { user } = await auth.api.signUpEmail({
      body: args,
      headers,
    })

    return { user }
  },
})
