import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { Id } from './_generated/dataModel'
import { MutationCtx, mutation, query } from './_generated/server'
import { LeaveRequestValidator } from './schema'

const getDays = (start: number, end: number) => {
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
}
const LEAVE_QUOTA = 24
export const raise = mutation({
  args: LeaveRequestValidator.omit(
    'status',
    'approvedBy',
    'createdAt',
    'updatedAt',
  ),
  handler: async (ctx, args) => {
    if (args.endDate < args.startDate) {
      throw new Error('Invalid date range')
    }
    const requestDays = getDays(args.startDate, args.endDate)
    const year = new Date(args.startDate).getFullYear()
    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', args.employeeId))
      .collect()
    const approved = requests.filter(
      (r) =>
        r.status === 'approved' && new Date(r.startDate).getFullYear() === year,
    )
    let used = 0
    for (const r of approved) {
      used += getDays(r.startDate, r.endDate)
    }
    if (used >= LEAVE_QUOTA) {
      throw new Error('No leave balance remaining for this year')
    }
    const remaining = LEAVE_QUOTA - used
    if (requestDays > remaining) {
      throw new Error(`You only have ${remaining} leave days remaining`)
    }
    const requestId = await ctx.db.insert('leaveRequests', {
      employeeId: args.employeeId,
      leaveType: args.leaveType,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason.trim(),
      status: 'pending',
      approvedBy: undefined,
      createdAt: Date.now(),
    })
    return {
      success: true,
      requestId,
      remainingLeavesAfterApproval: remaining,
    }
  },
})
export const update = mutation({
  args: {
    leaveRequestId: v.id('leaveRequests'),
    body: LeaveRequestValidator.omit(
      'employeeId',
      'createdAt',
      'updatedAt',
    ).partial(),
  },
  handler: async (ctx, args) => {
    const leaveRequest = await ctx.db.get(args.leaveRequestId)
    if (!leaveRequest) {
      throw new Error('Leave request not found')
    }
    const patch: Partial<Doc<'leaveRequests'>> = {}
    if (args.body.leaveType !== undefined) {
      patch.leaveType = args.body.leaveType
    }
    if (args.body.startDate !== undefined) {
      patch.startDate = args.body.startDate
    }
    if (args.body.endDate !== undefined) {
      patch.endDate = args.body.endDate
    }
    if (args.body.reason !== undefined) {
      patch.reason = args.body.reason
    }
    if (args.body.status !== undefined) {
      patch.status = args.body.status
    }
    if (args.body.approvedBy !== undefined) {
      patch.approvedBy = args.body.approvedBy
    }
    if (Object.keys(patch).length === 0) {
      return null
    }
    patch.updatedAt = Date.now()
    await ctx.db.patch(args.leaveRequestId, patch)
    return null
  },
})

export const get = query({
  args: {
    leaveRequestId: v.id('leaveRequests'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leaveRequestId)
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('leaveRequests').order('desc').collect()
  },
})

export async function removeLeaveCascade(
  ctx: MutationCtx,
  leaveRequestId: Id<'leaveRequests'>,
) {
  await ctx.db.delete(leaveRequestId)
}

export const remove = mutation({
  args: {
    leaveRequestId: v.id('leaveRequests'),
  },
  handler: async (ctx, { leaveRequestId }) => {
    const leaveRequest = await ctx.db.get(leaveRequestId)
    if (!leaveRequest) {
      throw new Error('Leave request not found')
    }
    await removeLeaveCascade(ctx, leaveRequestId)
    return null
  },
})

export const getLeaveBalance = query({
  args: { employeeId: v.string() },
  handler: async (ctx, { employeeId }) => {
    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
      .collect()
    const approved = requests.filter((r) => r.status === 'approved')
    let usedLeaves = 0
    for (const leave of approved) {
      usedLeaves += getDays(leave.startDate, leave.endDate)
    }
    return {
      employeeId,
      leaveQuota: LEAVE_QUOTA,
      usedLeaves,
      remaining: LEAVE_QUOTA - usedLeaves,
    }
  },
})
export const getStats = query({
  args: {
    employeeId: v.string(),
    year: v.number(),
    month: v.optional(v.number()),
  },
  handler: async (ctx, { employeeId, year, month }) => {
    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
      .collect()
    const approved = requests.filter((r) => {
      const d = new Date(r.startDate)
      const matchesYear = r.status === 'approved' && d.getFullYear() === year
      if (!matchesYear) return false
      if (month !== undefined) {
        return d.getMonth() + 1 === month
      }
      return true
    })
    let usedLeaves = 0
    for (const leave of approved) {
      usedLeaves += getDays(leave.startDate, leave.endDate)
    }
    return {
      employeeId,
      year,
      month: month ?? null,
      leaveQuota: LEAVE_QUOTA,
      usedLeaves,
      remainingLeaves: LEAVE_QUOTA - usedLeaves,
      suggestedMonthlyLimit: Math.floor(LEAVE_QUOTA / 12),
    }
  },
})
