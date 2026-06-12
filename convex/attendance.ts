import { v } from 'convex/values'
import { eachDayOfInterval } from 'date-fns'
import { components } from './_generated/api'
import {
  organizationQuery,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'
import { vv } from './schema'

export default privateMutation({
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

export const listByEmployee = privateQuery({
  args: {
    employeeId: v.string(),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query('attendance')
      .withIndex('by_employee', (q) => q.eq('employeeId', args.employeeId))
      .order('desc')
      .collect()
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
      employees.flatMap(async (employee) => {
        return {
          employee,
          attendance: await Promise.all(
            weekOfDays.map(async (day) => {
              const attendanceForTheDay = await ctx.db
                .query('attendance')
                .withIndex('by_employee_and_date', (q) =>
                  q
                    .eq('employeeId', employee._id)
                    .eq('recordDate', day.getTime()),
                )
                .first()

              if (!attendanceForTheDay) {
                return {
                  date: day.getTime(),
                  loginTime: null,
                  logoutTime: null,
                  status: null,
                }
              }

              return {
                date: day.getTime(),
                loginTime: attendanceForTheDay.loginTime,
                logoutTime: attendanceForTheDay.logoutTime,
                status: attendanceForTheDay.status,
              }
            }),
          ),
        }
      }),
    )

    return employeesAttendance
  },
})
