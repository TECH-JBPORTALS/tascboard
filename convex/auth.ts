import { createClient, GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { BetterAuthOptions, betterAuth } from 'better-auth/minimal'
import { organization } from 'better-auth/plugins'
import { ac, admin, employee, owner } from '../lib/permissions'
import { components, internal } from './_generated/api'
import { DataModel } from './_generated/dataModel'
import { query } from './_generated/server'
import authConfig from './auth.config'
import authSchema from './schema'

// Better Auth Component
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: { schema: authSchema },
    verbose: false,
  },
)

function runAction(
  ctx: GenericCtx<DataModel>,
  action: typeof internal.emails.processInvitationEmail,
  args: {
    organizationId: string
    email: string
    invitationId: string
    organizationName: string
    inviterName: string
  },
): Promise<unknown>

function runAction(
  ctx: GenericCtx<DataModel>,
  action: typeof internal.emails.processVerificationEmail,
  args: {
    email: string
    verificationUrl: string
  },
): Promise<unknown>

function runAction(
  ctx: GenericCtx<DataModel>,
  action:
    | typeof internal.emails.processInvitationEmail
    | typeof internal.emails.processVerificationEmail,
  args:
    | {
        organizationId: string
        email: string
        invitationId: string
        organizationName: string
        inviterName: string
      }
    | {
        email: string
        verificationUrl: string
      },
) {
  if ('runAction' in ctx && typeof ctx.runAction === 'function') {
    return ctx.runAction(action, args)
  }
  throw new Error('Cannot run action in this context.')
}

function runMutation(
  ctx: GenericCtx<DataModel>,
  mutation: typeof internal.employeeProfiles.ensureProfileAfterInvite,
  args: { organizationId: string; userId: string },
): Promise<unknown>

function runMutation(
  ctx: GenericCtx<DataModel>,
  mutation: typeof internal.employees.auth.deleteInvitationRecord,
  args: { invitationId: string },
): Promise<unknown>

function runMutation(
  ctx: GenericCtx<DataModel>,
  mutation:
    | typeof internal.employeeProfiles.ensureProfileAfterInvite
    | typeof internal.employees.auth.deleteInvitationRecord,
  args: { organizationId: string; userId: string } | { invitationId: string },
) {
  if ('runMutation' in ctx && typeof ctx.runMutation === 'function') {
    return ctx.runMutation(mutation, args)
  }
  throw new Error('Cannot run mutation in this context.')
}

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: 'Tascboard',
    baseURL: {
      allowedHosts: ['*.vercel.app', '*.convex.site', process.env.SITE_URL!],
      fallback: process.env.SITE_URL!,
    },
    trustedOrigins: ['*.vercel.app', '*.convex.site', process.env.SITE_URL!],
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      async sendVerificationEmail({ user, url }) {
        await runAction(ctx, internal.emails.processVerificationEmail, {
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
        roles: { owner, admin, employee },
        async sendInvitationEmail(data) {
          await runAction(ctx, internal.emails.processInvitationEmail, {
            organizationId: data.organization.id,
            email: data.email,
            invitationId: data.id,
            organizationName: data.organization.name,
            inviterName: data.inviter.user.name,
          })
        },
        organizationHooks: {
          afterAcceptInvitation: async ({ invitation, user }) => {
            await runMutation(
              ctx,
              internal.employeeProfiles.ensureProfileAfterInvite,
              {
                organizationId: invitation.organizationId,
                userId: user.id,
              },
            )

            if ('runMutation' in ctx && typeof ctx.runMutation === 'function') {
              await ctx.runMutation(internal.inbox.createInboxItem, {
                organizationId: invitation.organizationId,
                recipientUserId: user.id,
                kind: 'onboarding',
                title: 'Complete your employee profile',
                snippet:
                  'A few details to get you started — takes about 5 minutes',
                body: 'Welcome aboard. Complete your profile below so payroll, compliance, and your team have what they need.',
              })
            }
          },
          afterCancelInvitation: async ({ invitation }) => {
            await runMutation(
              ctx,
              internal.employees.auth.deleteInvitationRecord,
              {
                invitationId: invitation.id,
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
          definePayload: ({ session, user }) => ({
            orgId: session.activeOrganizationId as string,
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

  return await auth.api.listOrganizations({ headers })
})

export const getActiveOrganization = query(async (ctx) => {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

  return await auth.api.getFullOrganization({ headers })
})
