import { ConvexError } from 'convex/values'
import { ERROR_CODES } from '../helpers/errors'
import { Id } from './_generated/dataModel'
import { query } from './_generated/server'
import { vv } from './schema'

export const firstByUser = query({
  args: { userId: vv.string() },
  returns: vv.nullable(vv.doc('employee')),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('employee')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .first()
  },
})

export const list = query({
  args: { userId: vv.string() },
  returns: vv.array(vv.doc('organization')),
  handler: async (ctx, args) => {
    const employeesOrganizations = await ctx.db
      .query('employee')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .collect()

    const organizations = await Promise.all(
      employeesOrganizations.map(async (eo) => {
        const organization = await ctx.db
          .query('organization')
          .withIndex('by_id', (q) =>
            q.eq('_id', eo.organizationId as Id<'organization'>),
          )
          .first()

        if (!organization)
          throw new ConvexError(
            ERROR_CODES.ORGANIZATION.ORGANIZATION_NOT_FOUND.message,
          )

        return organization
      }),
    )

    return organizations
  },
})
