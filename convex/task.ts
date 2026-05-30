import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { Id } from './_generated/dataModel'
import { MutationCtx } from './_generated/server'
import { privateMutation, privateQuery } from './lib/customFunctions'
import { getTrackMembers } from './lib/memberHelper'
import { formatTaskDate, logTaskActivity } from './lib/taskActivityLog'
import { taskPriorityLabels, taskStatusLabels } from './lib/taskDisplay'
import {
  compareTaskStatusOrder,
  getNextStatusOrder,
  getTasksInStatus,
  reindexStatusColumn,
} from './lib/taskKanban'
import { listTasksForTrack } from './lib/taskList'
import {
  TaskPriorityValidator,
  TaskStatusValidator,
  TaskValidator,
} from './schema'

/**
 * Create Task
 */
export const create = privateMutation({
  args: TaskValidator.omit(
    'taskCode',
    'createdAt',
    'updatedAt',
    'createdBy',
    'statusOrder',
  ),
  handler: async (ctx, args) => {
    const lastTask = await ctx.db
      .query('tasks')
      .withIndex('by_track', (q) => q.eq('trackId', args.trackId))
      .order('desc')
      .first()

    const statusOrder = await getNextStatusOrder(ctx, args.trackId, args.status)

    const taskId = await ctx.db.insert('tasks', {
      trackId: args.trackId,
      projectId: args.projectId,
      sprintId: args.sprintId,
      // Find the next task number based on the previous task count in the track.
      taskCode: (lastTask ? parseInt(lastTask.taskCode) + 1 : 1).toString(),
      title: args.title.trim(),
      description: args.description,
      status: args.status,
      statusOrder,
      createdBy: ctx.session.userId,
      priority: args.priority,
      complexity: args.complexity,
      dueDate: args.dueDate,
      startedAt: args.status === 'in_progress' ? Date.now() : undefined,
      completedAt: args.status === 'done' ? Date.now() : undefined,
      createdAt: Date.now(),
    })

    await logTaskActivity(ctx, {
      taskId,
      actorUserId: ctx.session.userId,
      actorName: ctx.session.user.name,
      kind: 'created',
      toValue: args.title.trim(),
    })

    return taskId
  },
})

/**
 * Get Task by ID
 */
export const get = privateQuery({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)
    if (!task) return null

    const track = await ctx.db.get(task.trackId)
    const project = track ? await ctx.db.get(track.projectId) : null

    const taskLabelLinks = await ctx.db
      .query('taskLabels')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .collect()

    const labels = (
      await Promise.all(taskLabelLinks.map((l) => ctx.db.get(l.labelId)))
    ).filter((l): l is Doc<'labels'> => l !== null)
    const { members } = await getTrackMembers(ctx, task.trackId)
    return {
      ...task,
      track,
      project,
      labels,
      members,
    }
  },
})

/**
 * List Tasks by Track
 */
export const listByTrack = privateQuery({
  args: {
    trackId: v.id('tracks'),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_track', (q) => q.eq('trackId', args.trackId))
      .collect()

    return tasks.toSorted(compareTaskStatusOrder)
  },
})

export const reorderKanban = privateMutation({
  args: {
    taskId: v.id('tasks'),
    status: TaskStatusValidator,
    statusOrder: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error('Task not found')
    }

    const oldStatus = task.status
    const newStatus = args.status
    const targetIndex = Math.max(0, Math.floor(args.statusOrder))

    const targetTasks = (
      await getTasksInStatus(ctx, task.trackId, newStatus)
    ).filter((t) => t._id !== args.taskId)

    const insertIndex = Math.min(targetIndex, targetTasks.length)
    targetTasks.splice(insertIndex, 0, task)

    const actorUserId = ctx.session.userId
    const actorName = ctx.session.user.name

    await Promise.all(
      targetTasks.map((columnTask, index) => {
        const patch: Partial<Doc<'tasks'>> = {
          statusOrder: index,
          updatedAt: Date.now(),
        }

        if (columnTask._id === args.taskId && newStatus !== oldStatus) {
          patch.status = newStatus
        }

        return ctx.db.patch(columnTask._id, patch)
      }),
    )

    if (newStatus !== oldStatus) {
      await logTaskActivity(ctx, {
        taskId: args.taskId,
        actorUserId,
        actorName,
        kind: 'status_changed',
        fromValue: taskStatusLabels[oldStatus] ?? oldStatus,
        toValue: taskStatusLabels[newStatus] ?? newStatus,
      })

      await reindexStatusColumn(ctx, task.trackId, oldStatus, args.taskId)
    }

    return null
  },
})

export const listTaskEmployees = privateQuery({
  args: {
    trackId: v.id('tracks'),
  },
  handler: async (ctx, args) => {
    // 1. Get tasks in track
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_track', (q) => q.eq('trackId', args.trackId))
      .collect()

    const taskIds = tasks.map((t) => t._id)

    if (taskIds.length === 0) return []

    // 2. Get all task members for those tasks
    const memberLists = await Promise.all(
      taskIds.map((taskId) =>
        ctx.db
          .query('taskMember')
          .withIndex('by_task', (q) => q.eq('taskId', taskId))
          .collect(),
      ),
    )

    const members = memberLists.flat()

    // 3. Deduplicate by employeeId
    const uniqueMembersMap = new Map<string, (typeof members)[number]>()

    for (const m of members) {
      if (!uniqueMembersMap.has(m.employeeId)) {
        uniqueMembersMap.set(m.employeeId, m)
      }
    }

    const uniqueMembers = [...uniqueMembersMap.values()]

    // 4. Enrich exactly like taskMembers.ts
    const results = await Promise.all(
      uniqueMembers.map(async (member) => {
        const profile = await ctx.db
          .query('employeeProfiles')
          .withIndex('by_employee', (q) =>
            q.eq('employeeId', member.employeeId),
          )
          .unique()

        const image = profile?.profilePhotoStorageId
          ? await ctx.storage.getUrl(profile.profilePhotoStorageId)
          : ''

        return {
          _id: member.employeeId,
          employeeId: member.employeeId,
          lead: member.lead ?? false,
          employee: {
            _id: profile?.employeeId ?? member.employeeId,
            name: profile
              ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
              : ctx.session.user.name,
            email: ctx.session.user.email ?? '',
            image: image ?? '',
          },
        }
      }),
    )

    return results
  },
})

export const list = privateQuery({
  args: {
    trackId: v.id('tracks'),
    sprintId: v.optional(v.id('sprints')),
    statuses: v.optional(v.array(TaskStatusValidator)),
    assigneeIds: v.optional(v.array(v.string())),
    labelIds: v.optional(v.array(v.id('labels'))),
    noDueDate: v.optional(v.boolean()),
    dueFrom: v.optional(v.number()),
    dueTo: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const statuses = args.statuses
    const assigneeIds = args.assigneeIds
    const labelIds = args.labelIds

    return await listTasksForTrack(ctx, {
      trackId: args.trackId,
      sprintId: args.sprintId,
      statuses,
      assigneeIds,
      labelIds,
      noDueDate: args.noDueDate,
      dueFrom: args.dueFrom,
      dueTo: args.dueTo,
    })
  },
})

/** Update Task */
export const update = privateMutation({
  args: {
    taskId: v.id('tasks'),
    body: TaskValidator.omit(
      'trackId',
      'projectId',
      'taskCode',
      'createdAt',
      'updatedAt',
    ).partial(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)

    if (!task) {
      throw new Error('Task not found')
    }

    const actorUserId = ctx.session.userId
    const actorName = ctx.session.user.name
    const patch: Partial<Doc<'tasks'>> = {}

    if (args.body.title !== undefined) {
      const trimmed = args.body.title.trim()
      if (!trimmed) throw new Error('Task title cannot be empty')
      if (trimmed !== task.title) {
        patch.title = trimmed
        await logTaskActivity(ctx, {
          taskId: args.taskId,
          actorUserId,
          actorName,
          kind: 'title_changed',
          fromValue: task.title,
          toValue: trimmed,
        })
      }
    }

    if (args.body.description !== undefined) {
      patch.description = args.body.description
    }

    if (args.body.status !== undefined && args.body.status !== task.status) {
      patch.status = args.body.status
      await logTaskActivity(ctx, {
        taskId: args.taskId,
        actorUserId,
        actorName,
        kind: 'status_changed',
        fromValue: taskStatusLabels[task.status] ?? task.status,
        toValue: taskStatusLabels[args.body.status] ?? args.body.status,
      })
    }

    if (
      args.body.priority !== undefined &&
      args.body.priority !== task.priority
    ) {
      patch.priority = args.body.priority
      await logTaskActivity(ctx, {
        taskId: args.taskId,
        actorUserId,
        actorName,
        kind: 'priority_changed',
        fromValue: taskPriorityLabels[task.priority] ?? task.priority,
        toValue: taskPriorityLabels[args.body.priority] ?? args.body.priority,
      })
    }

    if (args.body.complexity !== undefined)
      patch.complexity = args.body.complexity

    if (
      Object.hasOwn(args.body, 'dueDate') &&
      args.body.dueDate !== task.dueDate
    ) {
      patch.dueDate = args.body.dueDate
      await logTaskActivity(ctx, {
        taskId: args.taskId,
        actorUserId,
        actorName,
        kind: 'due_date_changed',
        fromValue: task.dueDate ? formatTaskDate(task.dueDate) : '',
        toValue: args.body.dueDate
          ? formatTaskDate(args.body.dueDate)
          : 'Unset',
      })
    }

    if (Object.hasOwn(args.body, 'sprintId')) {
      const nextSprintId = args.body.sprintId ?? undefined
      const currentSprintId = task.sprintId ?? undefined
      if (nextSprintId !== currentSprintId) {
        patch.sprintId = nextSprintId
      }
    }

    if (Object.keys(patch).length === 0) {
      return null
    }

    patch.updatedAt = Date.now()
    await ctx.db.patch(args.taskId, patch)

    return null
  },
})

/** CASCADE DELETE */
export async function removeTaskCascade(ctx: MutationCtx, taskId: Id<'tasks'>) {
  const subtasks = await ctx.db
    .query('subtasks')
    .withIndex('by_task_and_order', (q) => q.eq('taskId', taskId))
    .collect()

  await Promise.all(subtasks.map((s) => ctx.db.delete(s._id)))

  const labelLinks = await ctx.db
    .query('taskLabels')
    .withIndex('by_task', (q) => q.eq('taskId', taskId))
    .collect()

  await Promise.all(labelLinks.map((l) => ctx.db.delete(l._id)))

  const activities = await ctx.db
    .query('taskActivities')
    .withIndex('by_task', (q) => q.eq('taskId', taskId))
    .collect()

  await Promise.all(activities.map((a) => ctx.db.delete(a._id)))

  const comments = await ctx.db
    .query('comments')
    .withIndex('by_task', (q) => q.eq('taskId', taskId))
    .collect()

  await Promise.all(comments.map((c) => ctx.db.delete(c._id)))

  await ctx.db.delete(taskId)
}

/** REMOVE TASK */
export const remove = privateMutation({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId)

    if (!task) {
      throw new Error('Task not found')
    }

    await removeTaskCascade(ctx, taskId)

    return null
  },
})
