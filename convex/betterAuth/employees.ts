import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
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

export const getInOrganization = query({
  args: { employeeId: v.string(), organizationId: v.string() },
  returns: vv.nullable(vv.doc('employee')),
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId as Id<'employee'>)
    if (!employee || employee.organizationId !== args.organizationId) {
      return null
    }
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

export const list = query({
  args: { organizationId: vv.string() },
  returns: vv.array(
    vv.object({
      _id: vv.id('employee'),
      userId: vv.string(),
      role: vv.string(),
      createdAt: vv.number(),
      active: vv.boolean(),
      user: vv.doc('user').omit('emailVerified', '_creationTime'),
    }),
  ),
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query('employee')
      .withIndex('by_organization_role', (q) =>
        q.eq('organizationId', args.organizationId).eq('role', 'employee'),
      )
      .collect()

    const employeesWithUser = await Promise.all(
      employees.map(async (employee) => {
        const user = await ctx.db.get(employee.userId as Id<'user'>)

        if (!user) throw new Error('User not found')
        return {
          _id: employee._id,
          userId: employee.userId,
          role: employee.role,
          createdAt: employee.createdAt,
          active: employee.active,
          user: {
            name: user.name,
            email: user.email,
            image: user?.image,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            userId: user.userId,
            _id: user._id,
          },
        }
      }),
    )

    return employeesWithUser
  },
})

export const setActive = mutation({
  args: { employeeId: v.string(), active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId as Id<'employee'>)
    if (!employee) throw new Error('Employee not found.')

    await ctx.db.patch(employee._id, { active: args.active })
    return null
  },
})

async function resetActiveOrganizationForUser(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  userId: string,
  removedOrganizationId: string,
) {
  const remainingMemberships = await ctx.db
    .query('employee')
    .withIndex('userId', (q) => q.eq('userId', userId))
    .collect()

  const fallbackOrganizationId = remainingMemberships[0]?.organizationId ?? null

  const sessions = await ctx.db
    .query('session')
    .withIndex('userId', (q) => q.eq('userId', userId))
    .collect()

  for (const session of sessions) {
    if (session.activeOrganizationId !== removedOrganizationId) continue
    await ctx.db.patch(session._id, {
      activeOrganizationId: fallbackOrganizationId,
    })
  }
}

/** Deletes the employee row and clears active org on that user's sessions when needed. */
export const removeFromOrganization = mutation({
  args: { employeeId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId as Id<'employee'>)
    if (!employee) throw new Error('Employee not found.')

    const { userId, organizationId } = employee

    await ctx.db.delete(employee._id)
    await resetActiveOrganizationForUser(ctx, userId, organizationId)

    return null
  },
})
