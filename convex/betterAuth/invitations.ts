import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { query } from './_generated/server'
import { vv } from './schema'

const invitationPreviewReturn = v.union(
  v.object({
    id: v.string(),
    email: v.string(),
    organizationId: v.string(),
    organizationName: v.string(),
    organizationSlug: v.string(),
    role: v.union(v.string(), v.null()),
    status: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    inviterId: v.string(),
  }),
  v.null(),
)

/** Load invitation and org by id from component tables (any status). */
export const getById = query({
  args: { invitationId: v.string() },
  returns: invitationPreviewReturn,
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId as Id<'invitation'>)
    if (!invitation) return null

    const organization = await ctx.db.get(
      invitation.organizationId as Id<'organization'>,
    )

    return {
      id: invitation._id,
      email: invitation.email,
      organizationId: invitation.organizationId,
      organizationName: organization?.name ?? '',
      organizationSlug: organization?.slug ?? '',
      role: invitation.role ?? null,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      inviterId: invitation.inviterId,
    }
  },
})

export const listPendingInvitations = query({
  args: { organizationId: vv.string() },
  returns: vv.array(vv.doc('invitation')),
  handler: async (ctx, args) => {
    const invitations = await ctx.db
      .query('invitation')
      .withIndex('by_organization_status_email', (q) =>
        q.eq('organizationId', args.organizationId).eq('status', 'pending'),
      )
      .collect()
    return invitations
  },
})
