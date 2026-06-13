import { v } from 'convex/values'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { components } from './_generated/api'
import { internalMutation } from './_generated/server'
import {
  organizationMutation,
  organizationQuery,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'
import { vv } from './schema'

type AttendanceStatus = 'present' | 'on leave' | 'late' | 'half day'

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

    return attendance
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
  handler: async (ctx, { start, end }) => {
    const organizationId = ctx.session.activeOrganizationId

    // 1. Get all employees in the organization
    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId,
      role: 'employee',
    })

    const weekOfDays = eachDayOfInterval({
      start,
      end,
    })

    const employeesAttendance = await Promise.all(
      employees.map(async (employee) => {
        const attendanceEntries = await Promise.all(
          weekOfDays.map(async (day) => {
            const dateKey = day.toDateString()
            const attendanceForTheDay = await ctx.db
              .query('attendance')
              .withIndex('by_employee_and_date', (q) =>
                q
                  .eq('employeeId', employee._id)
                  .gte('recordDate', day.getTime())
                  .lt('recordDate', addDays(day, 1).getTime()),
              )
              .first()

            return [
              dateKey,
              attendanceForTheDay
                ? {
                    loginTime: attendanceForTheDay.loginTime,
                    logoutTime: attendanceForTheDay.logoutTime ?? null,
                    status: attendanceForTheDay.status,
                  }
                : {
                    loginTime: null,
                    logoutTime: null,
                    status: null,
                  },
            ] as const
          }),
        )

        return {
          employee,
          attendance: Object.fromEntries(attendanceEntries),
        }
      }),
    )

    return employeesAttendance
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
