import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import {
  organizationMutation,
  organizationQuery,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'
import { vv } from './schema'

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

export const seedDailyReports = privateMutation({
  args: {},

  returns: v.null(),

  handler: async (ctx) => {
    const existing = await ctx.db.query('dailyReport').collect()

    if (existing.length > 0) {
      return null
    }

    const samples: Omit<Doc<'dailyReport'>, '_id' | '_creationTime'>[] = [
      {
        employeeId: ctx.session.userId,
        reportDate: Date.now(),
        workSummary:
          'Completed dashboard UI implementation and fixed authentication bugs.',
        loginTime: '09:00 AM',
        logoutTime: '06:00 PM',
        reviewerId: ctx.session.userId,
        remark: 'Good progress',
        createdAt: Date.now(),
      },
      {
        employeeId: ctx.session.userId,
        reportDate: Date.now(),
        workSummary: 'Worked on Convex backend APIs and optimized queries.',
        loginTime: '09:30 AM',
        logoutTime: '06:30 PM',
        reviewerId: ctx.session.userId,
        remark: 'Need query review',
        createdAt: Date.now(),
      },
    ]

    for (const report of samples) {
      await ctx.db.insert('dailyReport', report)
    }

    return null
  },
})
