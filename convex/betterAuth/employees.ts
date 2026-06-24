import { ConvexError } from 'convex/values'
import { ERROR_CODES } from '../helpers/errors'
import { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { vv } from './schema'

export const getByOrganizationUser = query({
  args: { organizationId: vv.string(), userId: vv.string() },
  returns: vv.doc('employee'),
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query('employee')
      .withIndex('by_organization_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId),
      )
      .first()

    if (!employee)
      throw new ConvexError(
        ERROR_CODES.ORGANIZATION.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION
          .message,
      )

    return employee
  },
})

/** List all the employees */
export const list = query({
  args: vv
    .doc('employee')
    .pick('role')
    .partial()
    .extend({ organizationId: vv.string() }),
  returns: vv.array(vv.doc('employee').extend({ user: vv.doc('user') })),
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query('employee')
      .withIndex('by_organization_active', (q) =>
        q.eq('organizationId', args.organizationId).eq('active', true),
      )
      .filter((q) =>
        q.and(
          args.role
            ? q.eq(q.field('role'), args.role)
            : q.eq(q.field('active'), true),
        ),
      )
      .collect()

    const employeesWithUser = await Promise.all(
      employees.map(async (employee) => {
        const user = await ctx.db.get(employee.userId as Id<'user'>)

        if (!user) throw new Error('User not found')

        return {
          ...employee,
          user,
        }
      }),
    )

    return employeesWithUser
  },
})

/** Create a new employee */
export const create = mutation({
  args: {
    organizationId: vv.string(),
    userId: vv.string(),
    role: vv.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('employee', {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      createdAt: Date.now(),
      active: true,
    })
  },
})
