/**
 * Better Auth employee & invitation entities (`employee`, `invitation`, `user`, `organization` models).
 * Uses the betterAuth component adapter — keep profile/certificate logic in `employeeProfiles.ts`.
 */

import { v } from 'convex/values'
import { components } from '../_generated/api'
import { internalMutation, query } from '../_generated/server'
import { authComponent, createAuth } from '../auth'
import { type InvitationRecord } from '../lib/betterAuthAdapter'
import { organizationQuery } from '../lib/customFunctions'

const invitationPreview = v.object({
  status: v.string(),
  email: v.string(),
  organizationId: v.string(),
  organizationName: v.string(),
  organizationSlug: v.string(),
  organizationLogo: v.union(v.string(), v.null()),
  expiresAt: v.number(),
  role: v.union(v.string(), v.null()),
})

export const getInvitationPreview = query({
  args: { invitationId: v.string() },
  returns: v.union(invitationPreview, v.null()),
  handler: async (ctx, args) => {
    const invitation = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: 'invitation',
        where: [{ field: '_id', operator: 'eq', value: args.invitationId }],
      },
    )

    if (!invitation) return null

    const inv = invitation as InvitationRecord

    const organization = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: 'organization',
        where: [{ field: '_id', operator: 'eq', value: inv.organizationId }],
      },
    )

    if (!organization) return null

    const org = organization as {
      name: string
      slug: string
      logo?: string | null
    }

    return {
      status: inv.status,
      email: inv.email,
      organizationId: inv.organizationId,
      organizationName: org.name,
      organizationSlug: org.slug,
      organizationLogo: org.logo ?? null,
      expiresAt: inv.expiresAt,
      role: inv.role ?? null,
    }
  },
})

/** Called from Better Auth hooks when an invitation is cancelled. */
export const deleteInvitationRecord = internalMutation({
  args: { invitationId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: 'invitation',
        where: [{ field: '_id', operator: 'eq', value: args.invitationId }],
      },
    })
    return null
  },
})

export const list = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const employees = await auth.api.listMembers({
      headers,
    })

    return employees.members
  },
})

export const listPendingInvitations = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const invitations = await auth.api.listInvitations({
      headers,
    })

    return invitations
  },
})
