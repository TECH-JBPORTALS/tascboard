import { v } from 'convex/values'
import { endOfDay, format, startOfDay } from 'date-fns'
import { components } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { Doc } from './_generated/dataModel'
import {
  organizationMutation,
  organizationQuery,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'
import {
  isTaskEligibleForDailyReport,
  listEmployeeDoneTasksForDay,
} from './lib/dailyReportTasks'
import { vv } from './schema'

const doneTaskValidator = v.object({
  _id: vv.id('tasks'),
  taskCode: v.string(),
  title: v.string(),
  projectId: vv.id('projects'),
  trackId: vv.id('tracks'),
  completedAt: v.optional(v.number()),
})

async function getCurrentEmployee(ctx: {
  runQuery: (
    ref: typeof components.betterAuth.employees.getByOrganizationUser,
    args: { organizationId: string; userId: string },
  ) => Promise<{ _id: string; userId: string } | null>
  session: { activeOrganizationId: string; userId: string }
}) {
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

export const listMyDoneTasksForToday = organizationQuery({
  args: {
    today: v.number(),
  },
  returns: v.array(doneTaskValidator),
  handler: async (ctx, args) => {
    const employee = await getCurrentEmployee(ctx)
    const dayStart = startOfDay(args.today).getTime()
    const dayEnd = endOfDay(args.today).getTime()

    const tasks = await listEmployeeDoneTasksForDay(
      ctx,
      employee,
      dayStart,
      dayEnd,
    )

    return tasks.map((task) => ({
      _id: task._id,
      taskCode: task.taskCode,
      title: task.title,
      projectId: task.projectId,
      trackId: task.trackId,
      completedAt: task.completedAt ?? task.updatedAt,
    }))
  },
})

export const submitAndLogout = organizationMutation({
  args: {
    attendanceId: vv.id('attendance'),
    workSummary: v.string(),
    taskIds: v.array(vv.id('tasks')),
    logoutTime: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const employee = await getCurrentEmployee(ctx)
    const attendance = await ctx.db.get(args.attendanceId)

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    if (attendance.employeeId !== employee._id) {
      throw new Error('Unauthorized')
    }

    if (attendance.logoutTime) {
      throw new Error('You have already logged out for today')
    }

    const summary = args.workSummary.trim()
    if (!summary) {
      throw new Error('Please describe what you accomplished today')
    }

    const dayStart = startOfDay(args.logoutTime).getTime()
    const dayEnd = endOfDay(args.logoutTime).getTime()

    for (const taskId of args.taskIds) {
      const eligible = await isTaskEligibleForDailyReport(
        ctx,
        employee,
        taskId,
        dayStart,
        dayEnd,
      )

      if (!eligible) {
        throw new Error('One or more selected tasks were not completed today')
      }
    }

    const reportId = await ctx.db.insert('dailyReport', {
      employeeId: employee._id,
      reportDate: dayStart,
      workSummary: summary,
      loginTime: format(attendance.loginTime, 'hh:mm aaa'),
      logoutTime: format(args.logoutTime, 'hh:mm aaa'),
      reviewerId: '',
      remark: '',
      createdAt: Date.now(),
    })

    for (const taskId of args.taskIds) {
      await ctx.db.insert('dailyReportTaskTag', {
        reportId,
        taskId,
        createdAt: Date.now(),
      })
    }

    await ctx.db.patch(args.attendanceId, {
      logoutTime: args.logoutTime,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const create = organizationMutation({
  args: vv
    .doc('dailyReport')
    .omit('_id', '_creationTime', 'createdAt', 'updatedAt'),

  returns: vv.id('dailyReport'),

  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert('dailyReport', {
      ...args,
      createdAt: Date.now(),
    })

    return reportId
  },
})

export const list = organizationQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('dailyReport').order('desc').collect()
  },
})

export const get = organizationQuery({
  args: {
    reportId: vv.id('dailyReport'),
  },

  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId)

    if (!report) {
      return null
    }

    return report
  },
})

export const getByEmployeeAndDate = organizationQuery({
  args: {
    employeeId: v.string(),
    recordDate: v.number(),
  },
  returns: v.union(
    v.object({
      _id: vv.id('dailyReport'),
      workSummary: v.string(),
      loginTime: v.string(),
      logoutTime: v.string(),
      remark: v.string(),
      createdAt: v.number(),
      tasks: v.array(
        v.object({
          _id: vv.id('tasks'),
          taskCode: v.string(),
          title: v.string(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (ctx.session.employee.role !== 'owner') {
      throw new Error('Only organization owners can view daily reports')
    }

    const reportDate = startOfDay(args.recordDate).getTime()

    const report = await ctx.db
      .query('dailyReport')
      .withIndex('by_employee_and_date', (q) =>
        q.eq('employeeId', args.employeeId).eq('reportDate', reportDate),
      )
      .first()

    if (!report) {
      return null
    }

    const tags = await ctx.db
      .query('dailyReportTaskTag')
      .withIndex('by_reportId', (q) => q.eq('reportId', report._id))
      .collect()

    const tasks = (
      await Promise.all(tags.map((tag) => ctx.db.get(tag.taskId)))
    ).filter((task): task is NonNullable<typeof task> => task !== null)

    return {
      _id: report._id,
      workSummary: report.workSummary,
      loginTime: report.loginTime,
      logoutTime: report.logoutTime,
      remark: report.remark,
      createdAt: report.createdAt,
      tasks: tasks.map((task) => ({
        _id: task._id,
        taskCode: task.taskCode,
        title: task.title,
      })),
    }
  },
})

export const update = organizationMutation({
  args: {
    reportId: vv.id('dailyReport'),
    body: vv
      .doc('dailyReport')
      .omit('_id', '_creationTime', 'employeeId', 'createdAt', 'updatedAt')
      .partial(),
  },

  handler: async (ctx, args) => {
    const { reportId, body } = args

    const report = await ctx.db.get(reportId)

    if (!report) {
      throw new Error('Daily report not found')
    }

    const patch: Partial<Doc<'dailyReport'>> = {}

    if (body.workSummary !== undefined) patch.workSummary = body.workSummary
    if (body.loginTime !== undefined) patch.loginTime = body.loginTime
    if (body.logoutTime !== undefined) patch.logoutTime = body.logoutTime
    if (body.reviewerId !== undefined) patch.reviewerId = body.reviewerId
    if (body.remark !== undefined) patch.remark = body.remark

    if (Object.keys(patch).length === 0) return null

    await ctx.db.patch(reportId, {
      ...patch,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const remove = organizationMutation({
  args: {
    reportId: vv.id('dailyReport'),
  },

  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId)

    if (!report) {
      throw new Error('Daily report not found')
    }

    // Delete related task tags
    const tags = await ctx.db
      .query('dailyReportTaskTag')
      .withIndex('by_reportId', (q) => q.eq('reportId', args.reportId))
      .collect()

    for (const tag of tags) {
      await ctx.db.delete(tag._id)
    }

    await ctx.db.delete(args.reportId)

    return null
  },
})

export const createTaskTag = privateMutation({
  args: {
    reportId: vv.id('dailyReport'),
    taskId: vv.id('tasks'),
  },

  returns: vv.id('dailyReportTaskTag'),

  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('dailyReportTaskTag')
      .withIndex('by_reportId_taskId', (q) =>
        q.eq('reportId', args.reportId).eq('taskId', args.taskId),
      )
      .unique()

    if (existing) {
      throw new Error('Task already tagged')
    }

    const tagId = await ctx.db.insert('dailyReportTaskTag', {
      ...args,
      createdAt: Date.now(),
    })

    return tagId
  },
})

export const listTaskTags = privateQuery({
  args: {
    reportId: vv.id('dailyReport'),
  },
  returns: v.array(
    v.object({
      _id: vv.id('dailyReportTaskTag'),
      _creationTime: v.number(),
      reportId: vv.id('dailyReport'),
      taskId: vv.id('tasks'),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('dailyReportTaskTag')
      .withIndex('by_reportId', (q) => q.eq('reportId', args.reportId))
      .collect()
  },
})

export const updateTaskTag = privateMutation({
  args: {
    tagId: vv.id('dailyReportTaskTag'),
    taskId: v.optional(vv.id('tasks')),
    reportId: v.optional(vv.id('dailyReport')),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId)

    if (!tag) {
      throw new Error('Task tag not found')
    }

    // If nothing is changing, just return
    if (!args.taskId && !args.reportId) {
      return null
    }

    // If updating reportId + taskId together OR individually
    const updated: Partial<{
      reportId: Id<'dailyReport'>
      taskId: Id<'tasks'>
      updatedAt: number
    }> = {
      updatedAt: Date.now(),
    }

    if (args.taskId) {
      updated.taskId = args.taskId
    }

    if (args.reportId) {
      updated.reportId = args.reportId
    }

    // Prevent duplicate (same reportId + taskId already exists)
    const finalReportId = args.reportId ?? tag.reportId
    const finalTaskId = args.taskId ?? tag.taskId

    const existing = await ctx.db
      .query('dailyReportTaskTag')
      .withIndex('by_reportId_taskId', (q) =>
        q.eq('reportId', finalReportId).eq('taskId', finalTaskId),
      )
      .unique()

    if (existing && existing._id !== args.tagId) {
      throw new Error('Task already tagged for this report')
    }

    await ctx.db.patch(args.tagId, updated)

    return null
  },
})

export const removeTaskTag = privateMutation({
  args: {
    tagId: vv.id('dailyReportTaskTag'),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId)

    if (!tag) {
      throw new Error('Task tag not found')
    }

    await ctx.db.delete(args.tagId)

    return null
  },
})
