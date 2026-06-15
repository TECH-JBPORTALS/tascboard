import { describe, expect, test } from 'bun:test'
import { convexTest } from 'convex-test'

import schema from '../schema'
import { modules } from './_modules.test'

describe('Leave Requests (database)', () => {
  test('approve and reject update leave request status', async () => {
    const t = convexTest(schema, modules)
    const leaveDate = new Date('2026-06-15T00:00:00.000Z').getTime()

    const requestId = await t.run(async (ctx) => {
      return await ctx.db.insert('leaveRequests', {
        employeeId: 'emp-1',
        leaveType: 'casual',
        startDate: leaveDate,
        endDate: leaveDate,
        reason: 'trip',
        status: 'pending',
        createdAt: Date.now(),
      })
    })

    await t.run(async (ctx) => {
      await ctx.db.patch('leaveRequests', requestId, {
        status: 'approved',
        approvedBy: 'owner-1',
        updatedAt: Date.now(),
      })
    })

    const approved = await t.run(async (ctx) =>
      ctx.db.get('leaveRequests', requestId),
    )
    expect(approved?.status).toBe('approved')
    expect(approved?.approvedBy).toBe('owner-1')

    const rejectId = await t.run(async (ctx) => {
      return await ctx.db.insert('leaveRequests', {
        employeeId: 'emp-1',
        leaveType: 'sick',
        startDate: leaveDate,
        endDate: leaveDate,
        reason: 'fever',
        rejectionReason: 'Insufficient coverage',
        status: 'rejected',
        approvedBy: 'owner-1',
        createdAt: Date.now(),
      })
    })

    const rejected = await t.run(async (ctx) =>
      ctx.db.get('leaveRequests', rejectId),
    )
    expect(rejected?.status).toBe('rejected')
    expect(rejected?.rejectionReason).toBe('Insufficient coverage')
  })

  test('delete removes leave request', async () => {
    const t = convexTest(schema, modules)
    const requestId = await t.run(async (ctx) => {
      return await ctx.db.insert('leaveRequests', {
        employeeId: 'emp-1',
        leaveType: 'casual',
        startDate: Date.now(),
        endDate: Date.now(),
        reason: 'day off',
        status: 'pending',
        createdAt: Date.now(),
      })
    })

    await t.run(async (ctx) => {
      await ctx.db.delete('leaveRequests', requestId)
    })

    const deleted = await t.run(async (ctx) =>
      ctx.db.get('leaveRequests', requestId),
    )
    expect(deleted).toBeNull()
  })
})
