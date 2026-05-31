import { query } from './_generated/server'
import { vv } from './schema'

export const getByOrganizationUser = query({
  args: { organizationId: vv.string(), userId: vv.string() },
  returns: vv.nullable(vv.doc('employee')),
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query('employee')
      .withIndex('by_organization_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId),
      )
      .unique()

    return employee
  },
})
