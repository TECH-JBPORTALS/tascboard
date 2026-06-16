import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { organizationMutation, organizationQuery } from './lib/customFunctions'
import { findActiveCompensation } from './lib/payrollHelpers'
import { vv } from './schema'

type OrganizationCtx = (QueryCtx | MutationCtx) & {
  session: {
    activeOrganizationId: string
    employee: { role: string }
  }
}

function assertOwner(ctx: OrganizationCtx) {
  if (ctx.session.employee.role !== 'owner') {
    throw new Error('Only organization owners can perform this action')
  }
}

const compensationReturn = vv
  .doc('employeeCompensation')
  .omit('_id', '_creationTime')

export const getActive = organizationQuery({
  args: {
    employeeId: v.string(),
    asOf: v.optional(v.number()),
  },
  returns: v.union(compensationReturn, v.null()),
  handler: async (ctx, args) => {
    assertOwner(ctx)

    const asOf = args.asOf ?? Date.now()
    const rows = await ctx.db
      .query('employeeCompensation')
      .withIndex('by_org_and_employee', (q) =>
        q
          .eq('organizationId', ctx.session.activeOrganizationId)
          .eq('employeeId', args.employeeId),
      )
      .collect()

    const active = findActiveCompensation(rows, asOf)
    if (!active) return null

    const { _id, _creationTime, ...rest } = active
    return rest
  },
})

export const listHistory = organizationQuery({
  args: {
    employeeId: v.string(),
  },
  returns: v.array(compensationReturn),
  handler: async (ctx, args) => {
    assertOwner(ctx)

    const rows = await ctx.db
      .query('employeeCompensation')
      .withIndex('by_org_and_employee', (q) =>
        q
          .eq('organizationId', ctx.session.activeOrganizationId)
          .eq('employeeId', args.employeeId),
      )
      .collect()

    return rows
      .sort((a, b) => b.effectiveFrom - a.effectiveFrom)
      .map(({ _id, _creationTime, ...rest }) => rest)
  },
})

export const set = organizationMutation({
  args: {
    employeeId: v.string(),
    monthlyBasicSalary: v.float64(),
    effectiveFrom: v.number(),
  },
  returns: vv.id('employeeCompensation'),
  handler: async (ctx, args) => {
    assertOwner(ctx)

    if (args.monthlyBasicSalary < 0) {
      throw new Error('Monthly basic salary cannot be negative')
    }

    const organizationId = ctx.session.activeOrganizationId
    const now = Date.now()

    const existing = await ctx.db
      .query('employeeCompensation')
      .withIndex('by_org_and_employee', (q) =>
        q
          .eq('organizationId', organizationId)
          .eq('employeeId', args.employeeId),
      )
      .collect()

    const active = findActiveCompensation(existing, args.effectiveFrom)
    if (
      active &&
      active.monthlyBasicSalary === args.monthlyBasicSalary &&
      active.effectiveFrom === args.effectiveFrom
    ) {
      return active._id
    }

    const dayBeforeEffective = args.effectiveFrom - 24 * 60 * 60 * 1000

    for (const row of existing) {
      if (
        row.effectiveTo === undefined &&
        row.effectiveFrom < args.effectiveFrom
      ) {
        await ctx.db.patch(row._id, {
          effectiveTo: dayBeforeEffective,
          updatedAt: now,
        })
      }
    }

    return await ctx.db.insert('employeeCompensation', {
      organizationId,
      employeeId: args.employeeId,
      monthlyBasicSalary: args.monthlyBasicSalary,
      effectiveFrom: args.effectiveFrom,
      createdAt: now,
    })
  },
})

export async function getActiveCompensationForEmployee(
  ctx: QueryCtx,
  organizationId: string,
  employeeId: string,
  asOf: number,
): Promise<Doc<'employeeCompensation'> | null> {
  const rows = await ctx.db
    .query('employeeCompensation')
    .withIndex('by_org_and_employee', (q) =>
      q.eq('organizationId', organizationId).eq('employeeId', employeeId),
    )
    .collect()

  return findActiveCompensation(rows, asOf)
}
