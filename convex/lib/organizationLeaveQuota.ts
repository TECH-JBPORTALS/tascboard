import type { MutationCtx, QueryCtx } from '../_generated/server'

export const DEFAULT_PAID_LEAVES = 15

export async function getPaidLeavesForYear(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
  year: number,
) {
  const doc = await ctx.db
    .query('organizationLeaveQuota')
    .withIndex('by_organization_and_year', (q) =>
      q.eq('organizationId', organizationId).eq('year', year),
    )
    .unique()

  return doc?.paidLeaves ?? DEFAULT_PAID_LEAVES
}

export async function listLeaveQuotas(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
) {
  const docs = await ctx.db
    .query('organizationLeaveQuota')
    .withIndex('by_organization_and_year', (q) =>
      q.eq('organizationId', organizationId),
    )
    .collect()

  return docs
    .map((doc) => ({ year: doc.year, paidLeaves: doc.paidLeaves }))
    .sort((a, b) => a.year - b.year)
}

export async function saveLeaveQuota(
  ctx: MutationCtx,
  organizationId: string,
  year: number,
  paidLeaves: number,
) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error('Invalid year')
  }
  if (!Number.isInteger(paidLeaves) || paidLeaves < 0 || paidLeaves > 365) {
    throw new Error('Paid leaves must be between 0 and 365')
  }

  const existing = await ctx.db
    .query('organizationLeaveQuota')
    .withIndex('by_organization_and_year', (q) =>
      q.eq('organizationId', organizationId).eq('year', year),
    )
    .unique()

  if (existing) {
    await ctx.db.patch('organizationLeaveQuota', existing._id, { paidLeaves })
    return
  }

  await ctx.db.insert('organizationLeaveQuota', {
    organizationId,
    year,
    paidLeaves,
  })
}

export async function ensureLeaveQuotaForYear(
  ctx: MutationCtx,
  organizationId: string,
  year: number,
) {
  const existing = await ctx.db
    .query('organizationLeaveQuota')
    .withIndex('by_organization_and_year', (q) =>
      q.eq('organizationId', organizationId).eq('year', year),
    )
    .unique()

  if (existing) return null

  await ctx.db.insert('organizationLeaveQuota', {
    organizationId,
    year,
    paidLeaves: DEFAULT_PAID_LEAVES,
  })

  return null
}
