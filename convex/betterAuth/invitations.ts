import { query } from './_generated/server'
import { vv } from './schema'

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
