import { Id } from './_generated/dataModel'
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

export const getUserByEmployeeId = query({
  args: { employeeId: vv.id('employee') },
  returns: vv.nullable(vv.doc('user')),
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId)
    if (!employee) return null

    const user = await ctx.db
      .query('user')
      .withIndex('by_id', (q) => q.eq('_id', employee.userId as Id<'user'>))
      .unique()

    return user
  },
})
