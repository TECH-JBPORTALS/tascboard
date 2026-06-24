import { v } from 'convex/values'
import { components } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import {
  organizationMutation,
  organizationQuery,
} from './helpers/customFunctions'
import {
  getLeaveDays,
  getUsedApprovedLeaves,
  normalizeLeaveDate,
  splitLeaveDaysByYear,
  validateAdvanceNotice,
  validateRaiseAgainstQuota,
} from './helpers/leaveRequestHelpers'
import { getPaidLeavesForYear } from './helpers/organizationLeaveQuota'
import { vv } from './schema'

const leaveTypeValidator = v.union(
  v.literal('sick'),
  v.literal('casual'),
  v.literal('emergency'),
)

const employeeRefValidator = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
  image: v.union(v.string(), v.null()),
  role: v.string(),
})

const enrichedLeaveValidator = vv.doc('leaveRequests').extend({
  employee: v.optional(employeeRefValidator),
})

type OrganizationCtx = (QueryCtx | MutationCtx) & {
  session: {
    activeOrganizationId: string
    userId: string
    employee: { role: string }
  }
}

function getDays(start: number, end: number) {
  return getLeaveDays(start, end)
}

function assertOwner(ctx: OrganizationCtx) {
  if (ctx.session.employee.role !== 'owner') {
    throw new Error('Only organization owners can perform this action')
  }
}

function assertEmployee(ctx: OrganizationCtx) {
  if (ctx.session.employee.role !== 'employee') {
    throw new Error('Only employees can raise leave requests')
  }
}

async function resolveCurrentEmployee(ctx: OrganizationCtx) {
  const employee = await ctx.runQuery(
    components.betterAuth.employees.getByOrganizationUser,
    {
      organizationId: ctx.session.activeOrganizationId,
      userId: ctx.session.userId,
    },
  )
  if (!employee) {
    throw new Error('Employee not found')
  }
  return employee
}

async function getOrgEmployeeIds(ctx: OrganizationCtx) {
  const employees = await ctx.runQuery(components.betterAuth.employees.list, {
    organizationId: ctx.session.activeOrganizationId,
    role: 'employee',
  })
  return new Set(employees.map((employee: { _id: string }) => employee._id))
}

async function enrichRequests(
  ctx: OrganizationCtx,
  requests: Doc<'leaveRequests'>[],
) {
  const members = await ctx.runQuery(components.betterAuth.employees.list, {
    organizationId: ctx.session.activeOrganizationId,
  })
  const memberMap = new Map(
    members.map(
      (member: {
        _id: string
        role: string
        user: { name: string; email: string; image?: string | null }
      }) => [member._id, member],
    ),
  )

  return requests.map((request) => {
    const member = memberMap.get(request.employeeId)
    return {
      ...request,
      employee: member
        ? {
            id: member._id,
            name: member.user.name,
            email: member.user.email,
            image: member.user.image ?? null,
            role: member.role,
          }
        : undefined,
    }
  })
}

async function assertCanAccessLeaveRequest(
  ctx: OrganizationCtx,
  leaveRequest: Doc<'leaveRequests'>,
) {
  const orgEmployeeIds = await getOrgEmployeeIds(ctx)
  if (!orgEmployeeIds.has(leaveRequest.employeeId)) {
    throw new Error('Leave request not found')
  }

  const current = await resolveCurrentEmployee(ctx)
  const isOwner = ctx.session.employee.role === 'owner'
  if (!isOwner && leaveRequest.employeeId !== current._id) {
    throw new Error('Unauthorized')
  }
}

async function getLeaveRequestOrThrow(
  ctx: OrganizationCtx,
  leaveRequestId: Id<'leaveRequests'>,
) {
  const leaveRequest = await ctx.db.get('leaveRequests', leaveRequestId)
  if (!leaveRequest) {
    throw new Error('Leave request not found')
  }
  await assertCanAccessLeaveRequest(ctx, leaveRequest)
  return leaveRequest
}

async function getQuotasForLeaveRange(
  ctx: OrganizationCtx,
  startDate: number,
  endDate: number,
) {
  const organizationId = ctx.session.activeOrganizationId
  const daysByYear = splitLeaveDaysByYear(startDate, endDate)
  const quotasByYear = new Map<number, number>()

  for (const year of daysByYear.keys()) {
    quotasByYear.set(
      year,
      await getPaidLeavesForYear(ctx, organizationId, year),
    )
  }

  return quotasByYear
}

export const raise = organizationMutation({
  args: {
    leaveType: leaveTypeValidator,
    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    requestId: vv.id('leaveRequests'),
    remainingLeavesAfterApproval: v.number(),
  }),
  handler: async (ctx, args) => {
    assertEmployee(ctx)
    const employee = await resolveCurrentEmployee(ctx)
    const startDate = normalizeLeaveDate(args.startDate)
    const endDate = normalizeLeaveDate(args.endDate)
    validateAdvanceNotice(startDate, Date.now())

    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee._id))
      .collect()
    const quotasByYear = await getQuotasForLeaveRange(ctx, startDate, endDate)
    const { remaining } = validateRaiseAgainstQuota({
      requests,
      startDate,
      endDate,
      quotasByYear,
    })
    const requestId = await ctx.db.insert('leaveRequests', {
      employeeId: employee._id,
      leaveType: args.leaveType,
      startDate,
      endDate,
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

export const update = organizationMutation({
  args: {
    leaveRequestId: vv.id('leaveRequests'),
    body: vv
      .doc('leaveRequests')
      .omit('_id', '_creationTime', 'employeeId', 'createdAt', 'updatedAt')
      .partial(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const leaveRequest = await getLeaveRequestOrThrow(ctx, args.leaveRequestId)
    const current = await resolveCurrentEmployee(ctx)
    const isOwner = ctx.session.employee.role === 'owner'

    if (!isOwner) {
      if (leaveRequest.employeeId !== current._id) {
        throw new Error('Unauthorized')
      }
      if (leaveRequest.status !== 'pending') {
        throw new Error('Only pending requests can be edited')
      }
      if (
        args.body.status !== undefined ||
        args.body.approvedBy !== undefined
      ) {
        throw new Error('Unauthorized')
      }
    } else if (leaveRequest.status !== 'pending') {
      const hasDisallowedField =
        args.body.leaveType !== undefined ||
        args.body.reason !== undefined ||
        args.body.startDate !== undefined ||
        args.body.endDate !== undefined

      if (hasDisallowedField) {
        throw new Error('Only status can be updated for processed requests')
      }

      if (args.body.status !== undefined) {
        if (args.body.status === 'pending') {
          throw new Error('Processed requests cannot be set back to pending')
        }
        if (args.body.status === leaveRequest.status) {
          return null
        }
        const isValidFlip =
          (leaveRequest.status === 'approved' &&
            args.body.status === 'rejected') ||
          (leaveRequest.status === 'rejected' &&
            args.body.status === 'approved')
        if (!isValidFlip) {
          throw new Error('Only approved and rejected statuses can be flipped')
        }
      }
    }

    const patch: Partial<Doc<'leaveRequests'>> = {}
    if (args.body.leaveType !== undefined) {
      patch.leaveType = args.body.leaveType
    }
    if (args.body.reason !== undefined) {
      patch.reason = args.body.reason.trim()
    }

    const nextStartDate =
      args.body.startDate !== undefined
        ? normalizeLeaveDate(args.body.startDate)
        : leaveRequest.startDate
    const nextEndDate =
      args.body.endDate !== undefined
        ? normalizeLeaveDate(args.body.endDate)
        : leaveRequest.endDate

    if (args.body.startDate !== undefined) {
      patch.startDate = nextStartDate
    }
    if (args.body.endDate !== undefined) {
      patch.endDate = nextEndDate
    }
    if (args.body.startDate !== undefined || args.body.endDate !== undefined) {
      if (nextEndDate < nextStartDate) {
        throw new Error('End date must be on or after start date')
      }
    }

    if (isOwner && args.body.status !== undefined) {
      patch.status = args.body.status
      if (args.body.status === 'rejected') {
        const rejectionReason =
          args.body.rejectionReason?.trim() ?? leaveRequest.rejectionReason
        if (!rejectionReason) {
          throw new Error('Rejection reason is required')
        }
        patch.rejectionReason = rejectionReason
        patch.approvedBy = current._id
      } else if (args.body.status === 'approved') {
        patch.rejectionReason = undefined
        patch.approvedBy = current._id
      } else {
        patch.rejectionReason = undefined
        patch.approvedBy = undefined
      }
    }

    if (isOwner && args.body.approvedBy !== undefined) {
      patch.approvedBy = args.body.approvedBy
    }
    if (Object.keys(patch).length === 0) {
      return null
    }
    patch.updatedAt = Date.now()
    await ctx.db.patch('leaveRequests', args.leaveRequestId, patch)
    return null
  },
})

export const get = organizationQuery({
  args: {
    leaveRequestId: vv.id('leaveRequests'),
  },
  returns: v.union(enrichedLeaveValidator, v.null()),
  handler: async (ctx, args) => {
    const leaveRequest = await ctx.db.get('leaveRequests', args.leaveRequestId)
    if (!leaveRequest) {
      return null
    }
    await assertCanAccessLeaveRequest(ctx, leaveRequest)
    const [enriched] = await enrichRequests(ctx, [leaveRequest])
    return enriched ?? null
  },
})

export const list = organizationQuery({
  args: {},
  returns: v.array(enrichedLeaveValidator),
  handler: async (ctx) => {
    const current = await resolveCurrentEmployee(ctx)
    const isOwner = ctx.session.employee.role === 'owner'

    let requests: Doc<'leaveRequests'>[]
    if (isOwner) {
      const orgEmployeeIds = await getOrgEmployeeIds(ctx)
      const all = await ctx.db.query('leaveRequests').order('desc').collect()
      requests = all.filter((request) => orgEmployeeIds.has(request.employeeId))
    } else {
      requests = await ctx.db
        .query('leaveRequests')
        .withIndex('by_employee', (q) => q.eq('employeeId', current._id))
        .order('desc')
        .collect()
    }

    return enrichRequests(ctx, requests)
  },
})

export const pendingCount = organizationQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    assertOwner(ctx)
    const orgEmployeeIds = await getOrgEmployeeIds(ctx)
    const pending = await ctx.db
      .query('leaveRequests')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect()
    return pending.filter((request) => orgEmployeeIds.has(request.employeeId))
      .length
  },
})

export const approveLeaveRequest = organizationMutation({
  args: {
    leaveRequestId: vv.id('leaveRequests'),
  },
  returns: v.object({
    success: v.boolean(),
    approvedDays: v.number(),
  }),
  handler: async (ctx, args) => {
    assertOwner(ctx)
    const leaveRequest = await ctx.db.get('leaveRequests', args.leaveRequestId)
    if (!leaveRequest) {
      throw new Error('Leave request not found')
    }
    const orgEmployeeIds = await getOrgEmployeeIds(ctx)
    if (!orgEmployeeIds.has(leaveRequest.employeeId)) {
      throw new Error('Leave request not found')
    }
    if (leaveRequest.status !== 'pending') {
      throw new Error('Request already processed')
    }
    const approvedDays = getDays(leaveRequest.startDate, leaveRequest.endDate)
    await ctx.db.patch('leaveRequests', args.leaveRequestId, {
      status: 'approved',
      approvedBy: (await resolveCurrentEmployee(ctx))._id,
      updatedAt: Date.now(),
    })
    return { success: true, approvedDays }
  },
})

export const rejectLeaveRequest = organizationMutation({
  args: {
    leaveRequestId: vv.id('leaveRequests'),
    rejectionReason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    assertOwner(ctx)
    const leaveRequest = await ctx.db.get('leaveRequests', args.leaveRequestId)
    if (!leaveRequest) {
      throw new Error('Leave request not found')
    }
    const orgEmployeeIds = await getOrgEmployeeIds(ctx)
    if (!orgEmployeeIds.has(leaveRequest.employeeId)) {
      throw new Error('Leave request not found')
    }
    if (leaveRequest.status !== 'pending') {
      throw new Error('Request already processed')
    }
    const rejectionReason = args.rejectionReason.trim()
    if (!rejectionReason) {
      throw new Error('Rejection reason is required')
    }
    await ctx.db.patch('leaveRequests', args.leaveRequestId, {
      status: 'rejected',
      approvedBy: (await resolveCurrentEmployee(ctx))._id,
      rejectionReason,
      updatedAt: Date.now(),
    })
    return { success: true }
  },
})

export const cancelLeaveRequest = organizationMutation({
  args: {
    leaveRequestId: vv.id('leaveRequests'),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const leaveRequest = await ctx.db.get('leaveRequests', args.leaveRequestId)
    if (!leaveRequest) {
      throw new Error('Leave request not found')
    }
    const current = await resolveCurrentEmployee(ctx)
    if (leaveRequest.employeeId !== current._id) {
      throw new Error('Unauthorized')
    }
    if (leaveRequest.status !== 'pending') {
      throw new Error('Only pending requests can be cancelled')
    }
    await removeLeaveCascade(ctx, args.leaveRequestId)
    return { success: true }
  },
})

export async function removeLeaveCascade(
  ctx: MutationCtx,
  leaveRequestId: Id<'leaveRequests'>,
) {
  await ctx.db.delete('leaveRequests', leaveRequestId)
}

export const remove = organizationMutation({
  args: {
    leaveRequestId: vv.id('leaveRequests'),
  },
  returns: v.null(),
  handler: async (ctx, { leaveRequestId }) => {
    await getLeaveRequestOrThrow(ctx, leaveRequestId)
    await removeLeaveCascade(ctx, leaveRequestId)
    return null
  },
})

export const getLeaveBalance = organizationQuery({
  args: {},
  returns: v.object({
    employeeId: v.string(),
    leaveQuota: v.number(),
    usedLeaves: v.number(),
    remaining: v.number(),
  }),
  handler: async (ctx) => {
    const employee = await resolveCurrentEmployee(ctx)
    const year = new Date().getFullYear()
    const leaveQuota = await getPaidLeavesForYear(
      ctx,
      ctx.session.activeOrganizationId,
      year,
    )
    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee._id))
      .collect()
    const approved = requests.filter((r) => r.status === 'approved')
    const usedLeaves = getUsedApprovedLeaves(approved, year)
    return {
      employeeId: employee._id,
      leaveQuota,
      usedLeaves,
      remaining: leaveQuota - usedLeaves,
    }
  },
})

export const getStats = organizationQuery({
  args: {
    year: v.number(),
    month: v.optional(v.number()),
  },
  returns: v.object({
    employeeId: v.string(),
    year: v.number(),
    month: v.union(v.number(), v.null()),
    leaveQuota: v.number(),
    usedLeaves: v.number(),
    remainingLeaves: v.number(),
    suggestedMonthlyLimit: v.number(),
  }),
  handler: async (ctx, { year, month }) => {
    const employee = await resolveCurrentEmployee(ctx)
    const leaveQuota = await getPaidLeavesForYear(
      ctx,
      ctx.session.activeOrganizationId,
      year,
    )
    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee._id))
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
    const usedLeaves = getUsedApprovedLeaves(approved)
    return {
      employeeId: employee._id,
      year,
      month: month ?? null,
      leaveQuota,
      usedLeaves,
      remainingLeaves: leaveQuota - usedLeaves,
      suggestedMonthlyLimit: Math.floor(leaveQuota / 12),
    }
  },
})
