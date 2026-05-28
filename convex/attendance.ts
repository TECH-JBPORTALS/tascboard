import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireIdentity } from './lib/auth'
import { AttendanceValidator } from './schema'

export const createAttendance = mutation({
  args: AttendanceValidator.omit('createdAt', 'updatedAt'),
  returns: v.id('attendance'),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const existingAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_employee_and_date', (q) =>
        q.eq('employeeId', args.employeeId).eq('recordDate', args.recordDate),
      )
      .first()

    if (existingAttendance) {
      throw new Error('Attendance already exists for this date')
    }

    return await ctx.db.insert('attendance', {
      employeeId: args.employeeId,
      recordDate: args.recordDate,
      loginTime: args.loginTime,
      logoutTime: args.logoutTime,
      status: args.status,
      createdAt: Date.now(),
    })
  },
})

export const listByEmployee = query({
  args: {
    employeeId: v.string(),
  },

  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    return await ctx.db
      .query('attendance')
      .withIndex('by_employee', (q) => q.eq('employeeId', args.employeeId))
      .order('desc')
      .collect()
  },
})

export const getAttendanceByDate = query({
  args: {
    employeeId: v.string(),
    recordDate: v.number(),
  },

  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    return await ctx.db
      .query('attendance')
      .withIndex('by_employee_and_date', (q) =>
        q.eq('employeeId', args.employeeId).eq('recordDate', args.recordDate),
      )
      .first()
  },
})

export const updateAttendance = mutation({
  args: {
    attendanceId: v.id('attendance'),
    body: AttendanceValidator.omit(
      'employeeId',
      'recordDate',
      'createdAt',
      'updatedAt',
    ).partial(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const attendance = await ctx.db.get(args.attendanceId)

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    const patch: Record<string, unknown> = {}

    if (args.body.loginTime !== undefined) {
      patch.loginTime = args.body.loginTime
    }

    if (args.body.logoutTime !== undefined) {
      patch.logoutTime = args.body.logoutTime
    }

    if (args.body.status !== undefined) {
      patch.status = args.body.status
    }

    patch.updatedAt = Date.now()

    await ctx.db.patch(args.attendanceId, patch)

    return null
  },
})

export const deleteAttendance = mutation({
  args: {
    attendanceId: v.id('attendance'),
  },

  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const attendance = await ctx.db.get(args.attendanceId)

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    await ctx.db.delete(args.attendanceId)

    return null
  },
})

export const markLogout = mutation({
  args: {
    attendanceId: v.id('attendance'),
    logoutTime: v.number(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const attendance = await ctx.db.get(args.attendanceId)

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    await ctx.db.patch(args.attendanceId, {
      logoutTime: args.logoutTime,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const listTodayAttendance = query({
  args: {
    startOfDay: v.number(),
    endOfDay: v.number(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    return await ctx.db
      .query('attendance')
      .filter((q) =>
        q.and(
          q.gte(q.field('recordDate'), args.startOfDay),
          q.lte(q.field('recordDate'), args.endOfDay),
        ),
      )
      .collect()
  },
})
