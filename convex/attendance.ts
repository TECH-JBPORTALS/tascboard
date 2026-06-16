import { v } from 'convex/values'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { components } from './_generated/api'
import type { QueryCtx } from './_generated/server'
import { internalMutation } from './_generated/server'
import { deriveStatusFromLogin } from './lib/attendanceStatus'
import {
  attendanceDateKey,
  getCalendarMonthRange,
  getElapsedWorkingDayKeysInMonth,
  scoreAttendanceForDays,
} from './lib/attendanceSummary'
import {
  endOfCalendarDay,
  startOfCalendarDay,
  toCalendarDateKey,
} from './lib/calendarDate'
import {
  organizationMutation,
  organizationQuery,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'
import { getDaySchedule, getWorkSchedule } from './lib/organizationWorkSchedule'
import { vv } from './schema'
import { dayWorkSchedule } from './tables/organizationWorkSchedule'

type AttendanceStatus = 'present' | 'on leave' | 'late' | 'half day' | 'absent'

const attendanceDayCell = v.object({
  attendanceId: v.union(vv.id('attendance'), v.null()),
  loginTime: v.union(v.number(), v.null()),
  logoutTime: v.union(v.number(), v.null()),
  status: v.union(
    v.literal('present'),
    v.literal('on leave'),
    v.literal('late'),
    v.literal('half day'),
    v.literal('absent'),
    v.null(),
  ),
  remarks: v.union(v.string(), v.null()),
  workingSchedule: dayWorkSchedule,
})

const employeeAttendanceRow = v.object({
  employee: v.any(),
  attendance: v.record(v.string(), attendanceDayCell),
})

const monthlySummaryRow = v.object({
  employee: v.any(),
  attendedCount: v.number(),
  totalSessions: v.number(),
  percentage: v.number(),
})

function assertOwner(role: string) {
  if (role !== 'owner') {
    throw new Error('Only organization owners can manage attendance')
  }
}

async function buildEmployeesAttendanceForDays(
  ctx: QueryCtx & {
    session: {
      activeOrganizationId: string
      userId: string
      employee: { role: string }
    }
    runQuery: (
      ref: typeof components.betterAuth.employees.list,
      args: { organizationId: string; role: string },
    ) => Promise<
      Array<{
        _id: string
        user: { name: string; image?: string | null }
      }>
    >
  },
  start: Date,
  end: Date,
) {
  const organizationId = ctx.session.activeOrganizationId

  const employees = await ctx.runQuery(components.betterAuth.employees.list, {
    organizationId,
    role: 'employee',
  })

  const schedule = await getWorkSchedule(ctx, organizationId)

  const days = eachDayOfInterval({
    start,
    end,
  })

  return Promise.all(
    employees.map(async (employee) => {
      const attendanceEntries = await Promise.all(
        days.map(async (day) => {
          const dateKey = toCalendarDateKey(day)
          const dayStart = startOfCalendarDay(day)
          const dayEnd = endOfCalendarDay(day)
          const attendanceForTheDay = await ctx.db
            .query('attendance')
            .withIndex('by_employee_and_date', (q) =>
              q
                .eq('employeeId', employee._id)
                .gte('recordDate', dayStart)
                .lt('recordDate', dayEnd),
            )
            .first()

          const cell = attendanceForTheDay
            ? {
                attendanceId: attendanceForTheDay._id,
                loginTime: attendanceForTheDay.loginTime,
                logoutTime: attendanceForTheDay.logoutTime ?? null,
                status: attendanceForTheDay.status,
                remarks: attendanceForTheDay.remarks ?? null,
                workingSchedule: getDaySchedule(schedule, day),
              }
            : {
                attendanceId: null,
                loginTime: null,
                logoutTime: null,
                status: null,
                remarks: null,
                workingSchedule: getDaySchedule(schedule, day),
              }

          return [dateKey, cell] as const
        }),
      )

      return {
        employee,
        attendance: Object.fromEntries(attendanceEntries),
      }
    }),
  )
}

function timestampOnDay(day: Date, hours: number, minutes: number): number {
  const date = new Date(day)
  date.setHours(hours, minutes, 0, 0)
  return date.getTime()
}

function statusForSeedDay(
  dayIndex: number,
  employeeIndex: number,
): AttendanceStatus {
  const pattern: AttendanceStatus[] = ['present', 'late', 'present', 'half day']
  return pattern[(dayIndex + employeeIndex) % pattern.length] ?? 'present'
}

/** @deprecated use `markLogin` instead */
export const createAttendance = privateMutation({
  args: vv
    .doc('attendance')
    .omit('_id', '_creationTime', 'createdAt', 'updatedAt'),
  returns: vv.id('attendance'),
  handler: async (ctx, args) => {
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

/** Lists current users attendance for the whole given month */
export const listMonthlyMineByMonth = organizationQuery({
  args: {
    date: v.number(),
  },
  returns: v.array(
    vv.doc('attendance').extend({
      workingSchedule: dayWorkSchedule,
    }),
  ),
  handler: async (ctx, args) => {
    const monthStart = startOfMonth(new Date(args.date))
    const monthEnd = addMonths(monthStart, 1)

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

    const schedule = await getWorkSchedule(
      ctx,
      ctx.session.activeOrganizationId,
    )

    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_employee_and_date', (q) =>
        q
          .eq('employeeId', employee._id)
          .gte('recordDate', monthStart.getTime())
          .lt('recordDate', monthEnd.getTime()),
      )
      .order('desc')
      .collect()

    return attendance.map((record) => ({
      ...record,
      workingSchedule: getDaySchedule(schedule, record.recordDate),
    }))
  },
})

export const getMyAttendanceByDate = organizationQuery({
  args: {
    recordDate: v.number(),
  },
  handler: async (ctx, args) => {
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

    return await ctx.db
      .query('attendance')
      .withIndex('by_employee_and_date', (q) =>
        q
          .eq('employeeId', employee._id)
          .gte('recordDate', startOfDay(args.recordDate).getTime())
          .lte('recordDate', addDays(args.recordDate, 1).getTime()),
      )
      .first()
  },
})

export const getAttendanceByDate = privateQuery({
  args: {
    employeeId: v.string(),
    recordDate: v.number(),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query('attendance')
      .withIndex('by_employee_and_date', (q) =>
        q.eq('employeeId', args.employeeId).eq('recordDate', args.recordDate),
      )
      .first()
  },
})

export const updateAttendance = privateMutation({
  args: {
    attendanceId: vv.id('attendance'),
    body: vv
      .doc('attendance')
      .omit(
        '_id',
        '_creationTime',
        'employeeId',
        'recordDate',
        'createdAt',
        'updatedAt',
      )
      .partial(),
  },
  handler: async (ctx, args) => {
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

    if (args.body.remarks !== undefined) {
      patch.remarks = args.body.remarks
    }

    patch.updatedAt = Date.now()

    await ctx.db.patch(args.attendanceId, patch)

    return null
  },
})

export const deleteAttendance = privateMutation({
  args: {
    attendanceId: vv.id('attendance'),
  },

  handler: async (ctx, args) => {
    const attendance = await ctx.db.get(args.attendanceId)

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    await ctx.db.delete(args.attendanceId)

    return null
  },
})

export const markLogin = organizationMutation({
  args: {},
  handler: async (ctx) => {
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

    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_employee_and_date', (q) =>
        q
          .eq('employeeId', employee._id)
          .gte('recordDate', startOfDay(Date.now()).getTime())
          .lte('recordDate', endOfDay(Date.now()).getTime()),
      )
      .first()

    if (attendance) {
      throw new Error('You are already logged in')
    }

    await ctx.db.insert('attendance', {
      employeeId: employee._id,
      recordDate: Date.now(),
      loginTime: Date.now(),
      status: 'present',
      createdAt: Date.now(),
    })

    return null
  },
})

export const markLogout = privateMutation({
  args: {
    attendanceId: vv.id('attendance'),
    logoutTime: v.number(),
  },
  handler: async (ctx, args) => {
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

export const listForEmployeesInDateRange = organizationQuery({
  args: {
    start: v.number(),
    end: v.number(),
  },
  returns: v.array(employeeAttendanceRow),
  handler: async (ctx, { start, end }) => {
    return await buildEmployeesAttendanceForDays(
      ctx,
      new Date(start),
      new Date(end),
    )
  },
})

export const listForEmployeesInMonth = organizationQuery({
  args: {
    month: v.number(),
  },
  returns: v.array(employeeAttendanceRow),
  handler: async (ctx, args) => {
    const monthStart = startOfMonth(new Date(args.month))
    const monthEnd = endOfMonth(new Date(args.month))

    return await buildEmployeesAttendanceForDays(ctx, monthStart, monthEnd)
  },
})

export const listMonthlySummaryForEmployees = organizationQuery({
  args: {
    month: v.number(),
    now: v.number(),
  },
  returns: v.array(monthlySummaryRow),
  handler: async (ctx, args) => {
    const organizationId = ctx.session.activeOrganizationId
    const { start: monthStart, end: monthEnd } = getCalendarMonthRange(
      args.month,
    )

    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId,
      role: 'employee',
    })

    const schedule = await getWorkSchedule(ctx, organizationId)
    const workingDayKeys = getElapsedWorkingDayKeysInMonth(
      schedule,
      args.month,
      args.now,
    )

    return Promise.all(
      employees.map(async (employee) => {
        const records = await ctx.db
          .query('attendance')
          .withIndex('by_employee_and_date', (q) =>
            q
              .eq('employeeId', employee._id)
              .gte('recordDate', monthStart)
              .lt('recordDate', endOfCalendarDay(monthEnd)),
          )
          .collect()

        const attendanceByDateKey = Object.fromEntries(
          records.map((record) => [
            attendanceDateKey(record.recordDate),
            { status: record.status },
          ]),
        )

        const score = scoreAttendanceForDays(
          attendanceByDateKey,
          workingDayKeys,
        )

        return {
          employee,
          ...score,
        }
      }),
    )
  },
})

export const getEmployeeDayDetail = organizationQuery({
  args: {
    employeeId: v.string(),
    recordDate: v.number(),
  },
  returns: attendanceDayCell,
  handler: async (ctx, args) => {
    const dayStart = startOfCalendarDay(args.recordDate)
    const dayEnd = endOfCalendarDay(args.recordDate)
    const schedule = await getWorkSchedule(
      ctx,
      ctx.session.activeOrganizationId,
    )

    const attendanceForTheDay = await ctx.db
      .query('attendance')
      .withIndex('by_employee_and_date', (q) =>
        q
          .eq('employeeId', args.employeeId)
          .gte('recordDate', dayStart)
          .lt('recordDate', dayEnd),
      )
      .first()

    if (!attendanceForTheDay) {
      return {
        attendanceId: null,
        loginTime: null,
        logoutTime: null,
        status: null,
        remarks: null,
        workingSchedule: getDaySchedule(schedule, dayStart),
      }
    }

    return {
      attendanceId: attendanceForTheDay._id,
      loginTime: attendanceForTheDay.loginTime,
      logoutTime: attendanceForTheDay.logoutTime ?? null,
      status: attendanceForTheDay.status,
      remarks: attendanceForTheDay.remarks ?? null,
      workingSchedule: getDaySchedule(schedule, dayStart),
    }
  },
})

export const ownerUpdateEmployeeDay = organizationMutation({
  args: {
    employeeId: v.string(),
    recordDate: v.number(),
    loginTime: v.optional(v.number()),
    logoutTime: v.optional(v.union(v.number(), v.null())),
    markAbsent: v.optional(v.boolean()),
    remarks: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertOwner(ctx.session.employee.role)

    const dayStart = startOfCalendarDay(args.recordDate)
    const recordDate = dayStart

    const existing = await ctx.db
      .query('attendance')
      .withIndex('by_employee_and_date', (q) =>
        q
          .eq('employeeId', args.employeeId)
          .gte('recordDate', dayStart)
          .lt('recordDate', endOfCalendarDay(args.recordDate)),
      )
      .first()

    if (args.markAbsent) {
      const remarks = args.remarks?.trim()
      if (!remarks) {
        throw new Error('Remarks are required when marking someone absent')
      }

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: 'absent',
          remarks,
          logoutTime: undefined,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert('attendance', {
          employeeId: args.employeeId,
          recordDate,
          loginTime: recordDate,
          status: 'absent',
          remarks,
          createdAt: Date.now(),
        })
      }

      return null
    }

    if (args.loginTime === undefined && args.logoutTime === undefined) {
      throw new Error('No changes to save')
    }

    const schedule = await getWorkSchedule(
      ctx,
      ctx.session.activeOrganizationId,
    )
    const daySchedule = getDaySchedule(schedule, dayStart)

    if (existing) {
      if (existing.status === 'absent') {
        throw new Error('Restore attendance before editing login time')
      }

      if (existing.status === 'on leave') {
        throw new Error('Cannot edit attendance for an employee on leave')
      }

      const patch: Record<string, unknown> = {
        updatedAt: Date.now(),
      }

      if (args.loginTime !== undefined) {
        patch.loginTime = args.loginTime
        if (existing.status === 'present' || existing.status === 'late') {
          patch.status = deriveStatusFromLogin(args.loginTime, daySchedule)
        }
      }

      if (args.logoutTime !== undefined) {
        patch.logoutTime = args.logoutTime ?? undefined
      }

      await ctx.db.patch(existing._id, patch)

      return null
    }

    if (args.loginTime === undefined) {
      throw new Error('Login time is required to create an attendance record')
    }

    await ctx.db.insert('attendance', {
      employeeId: args.employeeId,
      recordDate,
      loginTime: args.loginTime,
      logoutTime: args.logoutTime ?? undefined,
      status: deriveStatusFromLogin(args.loginTime, daySchedule),
      createdAt: Date.now(),
    })

    return null
  },
})

export const seed = internalMutation({
  args: {
    organizationId: v.string(),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
    employeeCount: v.number(),
    dayCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId: args.organizationId,
      role: 'employee',
    })

    const weekStart = addDays(startOfWeek(new Date()), 1)
    const days = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 2),
    })

    let created = 0
    let skipped = 0

    for (
      let employeeIndex = 0;
      employeeIndex < employees.length;
      employeeIndex++
    ) {
      const employee = employees[employeeIndex]
      if (!employee) continue

      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex]
        if (!day) continue

        const recordDate = day.getTime()
        const existing = await ctx.db
          .query('attendance')
          .withIndex('by_employee_and_date', (q) =>
            q.eq('employeeId', employee._id).eq('recordDate', recordDate),
          )
          .first()

        if (existing) {
          skipped += 1
          continue
        }

        const status = statusForSeedDay(dayIndex, employeeIndex)
        const loginHour = status === 'late' ? 10 : 9
        const loginMinute = status === 'late' ? 30 : 0
        const logoutHour = status === 'half day' ? 13 : 18

        await ctx.db.insert('attendance', {
          employeeId: employee._id,
          recordDate,
          loginTime: timestampOnDay(day, loginHour, loginMinute),
          logoutTime: timestampOnDay(day, logoutHour, 0),
          status,
          createdAt: Date.now(),
        })
        created += 1
      }
    }

    return {
      created,
      skipped,
      employeeCount: employees.length,
      dayCount: days.length,
    }
  },
})
