import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const getDays = (start: number, end: number) => {
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
}

const LEAVE_QUOTA = 24

export const raise = mutation({
  args: {
    employeeId: v.string(),
    leaveType: v.union(
      v.literal('sick'),
      v.literal('casual'),
      v.literal('emergency'),
    ),
    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
  },

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

export const approveLeaveRequest = mutation({
  args: {
    leaveRequestId: v.id('leaveRequests'),
    approvedBy: v.string(),
  },

  handler: async (ctx, { leaveRequestId, approvedBy }) => {
    const request = await ctx.db.get(leaveRequestId)

    if (!request) throw new Error('Leave request not found')
    if (request.status !== 'pending')
      throw new Error('Request already processed')

    const requestDays = getDays(request.startDate, request.endDate)
    const year = new Date(request.startDate).getFullYear()

    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', request.employeeId))
      .collect()

    const approved = requests.filter(
      (r) =>
        r.status === 'approved' && new Date(r.startDate).getFullYear() === year,
    )

    let used = 0
    for (const r of approved) {
      used += getDays(r.startDate, r.endDate)
    }

    const remaining = LEAVE_QUOTA - used

    if (requestDays > remaining) {
      throw new Error('Cannot approve: yearly leave quota exceeded')
    }

    await ctx.db.patch(leaveRequestId, {
      status: 'approved',
      approvedBy,
      updatedAt: Date.now(),
    })

    return {
      success: true,
      approvedDays: requestDays,
      remainingAfterApproval: remaining - requestDays,
    }
  },
})

export const rejectLeaveRequest = mutation({
  args: {
    leaveRequestId: v.id('leaveRequests'),
    approvedBy: v.string(),
    reason: v.optional(v.string()),
  },

  handler: async (ctx, { leaveRequestId, approvedBy, reason }) => {
    const request = await ctx.db.get(leaveRequestId)

    if (!request) throw new Error('Leave request not found')
    if (request.status !== 'pending')
      throw new Error('Request already processed')

    await ctx.db.patch(leaveRequestId, {
      status: 'rejected',
      approvedBy,
      updatedAt: Date.now(),
      reason: reason
        ? `${request.reason} | Rejected: ${reason}`
        : request.reason,
    })

    return {
      success: true,
      message: 'Leave request rejected successfully',
    }
  },
})

export const cancelLeaveRequest = mutation({
  args: {
    leaveRequestId: v.id('leaveRequests'),
  },

  handler: async (ctx, { leaveRequestId }) => {
    const request = await ctx.db.get(leaveRequestId)

    if (!request) throw new Error('Leave request not found')
    if (request.status !== 'pending')
      throw new Error('Request already processed')

    await ctx.db.patch(leaveRequestId, {
      status: 'rejected',
      updatedAt: Date.now(),
    })

    return {
      success: true,
      message: 'Leave request cancelled successfully',
    }
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

export const assignMonthlyLeaves = query({
  args: {
    employeeId: v.string(),
    month: v.number(),
    year: v.number(),
  },

  handler: async (ctx, { employeeId, month, year }) => {
    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
      .collect()

    const monthlyUsed = requests.filter((r) => {
      const d = new Date(r.startDate)
      return (
        r.status === 'approved' &&
        d.getMonth() + 1 === month &&
        d.getFullYear() === year
      )
    }).length

    return {
      employeeId,
      month,
      year,
      suggestedMonthlyLimit: Math.floor(LEAVE_QUOTA / 12),
      usedThisMonth: monthlyUsed,
    }
  },
})

export const assignYearlyLeaves = query({
  args: {
    employeeId: v.string(),
    year: v.number(),
  },

  handler: async (ctx, { employeeId, year }) => {
    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
      .collect()

    const approved = requests.filter(
      (r) =>
        r.status === 'approved' && new Date(r.startDate).getFullYear() === year,
    )

    let used = 0
    for (const r of approved) {
      used += getDays(r.startDate, r.endDate)
    }

    return {
      employeeId,
      year,
      yearlyQuota: LEAVE_QUOTA,
      usedLeaves: used,
      remainingLeaves: LEAVE_QUOTA - used,
    }
  },
})
