import { describe, expect, test } from 'bun:test'
import { convexTest } from 'convex-test'
import {
  DEFAULT_PAID_LEAVES,
  getPaidLeavesForYear,
  listLeaveQuotas,
  saveLeaveQuota,
} from '../lib/organizationLeaveQuota'
import schema from '../schema'
import { modules } from './_modules.test'

describe('organizationLeaveQuota', () => {
  test('returns default paid leaves when quota is not configured', async () => {
    const t = convexTest(schema, modules)
    const paidLeaves = await t.run(async (ctx) =>
      getPaidLeavesForYear(ctx, 'org-1', 2026),
    )
    expect(paidLeaves).toBe(DEFAULT_PAID_LEAVES)
  })

  test('saveLeaveQuota upserts per year', async () => {
    const t = convexTest(schema, modules)

    await t.run(async (ctx) => {
      await saveLeaveQuota(ctx, 'org-1', 2026, 20)
      await saveLeaveQuota(ctx, 'org-1', 2027, 15)
    })

    const quotas = await t.run(async (ctx) => listLeaveQuotas(ctx, 'org-1'))
    expect(quotas).toEqual([
      { year: 2026, paidLeaves: 20 },
      { year: 2027, paidLeaves: 15 },
    ])

    const paid2026 = await t.run(async (ctx) =>
      getPaidLeavesForYear(ctx, 'org-1', 2026),
    )
    expect(paid2026).toBe(20)
  })

  test('saveLeaveQuota rejects invalid values', async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.run(async (ctx) => saveLeaveQuota(ctx, 'org-1', 2026, -1)),
    ).rejects.toThrow('Paid leaves must be between 0 and 365')
  })
})
