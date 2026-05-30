import { beforeEach, describe, expect, test } from 'bun:test'
import { convexTest, TestConvexForDataModel } from 'convex-test'
import { startOfDay } from 'date-fns'

import { api } from '../_generated/api'
import { DataModel, Id } from '../_generated/dataModel'
import schema from '../schema'

import { modules } from './_modules.test'
import { registerProsemirrorSyncComponent } from './registerComponents.test'

function createTestClient(identity: { userId: string; orgId: string }) {
  const base = convexTest(schema, modules)
  registerProsemirrorSyncComponent(base)
  return base.withIdentity(identity)
}

describe('Task', () => {
  let t: TestConvexForDataModel<DataModel>

  let projectId: Id<'projects'>
  let trackId: Id<'tracks'>
  let taskId: Id<'tasks'>

  beforeEach(async () => {
    t = createTestClient({
      userId: 'user-1',
      orgId: 'org-1',
    })

    // --------------------
    // CREATE PROJECT
    // --------------------
    projectId = await t.mutation(api.project.create, {
      name: 'Project A',
      summary: 'Test project',
      icon: '📁',
      color: 'purple',
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: 'active',
    })

    // --------------------
    // CREATE TRACK
    // --------------------
    trackId = await t.mutation(api.track.create, {
      name: 'Track A',
      description: 'Test track',
      projectId,
      trackCode: 'TR-001',
      trackLeaderID: 'emp-1',
      status: 'active',
    })

    // --------------------
    // CREATE TASK
    // --------------------
    taskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      title: 'Initial Task',
      description: 'Task description',
      status: 'todo',
      priority: 'medium',
      complexity: 'easy',
      dueDate: 1700000000000,
    })

    await t.mutation(api.trackMember.toggleMember, {
      trackId,
      employeeId: 'emp-1',
    })

    await t.mutation(api.trackMember.toggleMember, {
      trackId,
      employeeId: 'emp-2',
    })
  })

  // --------------------
  // CREATE
  // --------------------
  test('create task', async () => {
    const task = await t.query(api.task.get, {
      taskId,
    })

    expect(task).not.toBeNull()

    expect(task?.title).toBe('Initial Task')
    expect(task?.status).toBe('todo')
    expect(task?.priority).toBe('medium')
  })
  test('prevents duplicate task activity spam for same user same day', async () => {
    await t.mutation(api.task.update, {
      taskId,
      body: {
        status: 'in_progress',
      },
    })

    await t.mutation(api.task.update, {
      taskId,
      body: {
        status: 'in_progress',
      },
    })

    const activities = await t
      .query(api.activity.listByTask, { taskId })
      .catch(() => [])

    const statusActivities = activities.filter(
      (a) =>
        typeof a === 'object' &&
        a !== null &&
        'kind' in a &&
        a.kind === 'status_changed',
    )

    expect(statusActivities.length).toBe(1)
  })
  // --------------------
  // GET
  // --------------------
  test('get returns task by id', async () => {
    const task = await t.query(api.task.get, {
      taskId,
    })

    expect(task?._id).toBe(taskId)
    expect(task?.title).toBe('Initial Task')
  })

  test('get returns null if task not found', async () => {
    await t.mutation(api.task.remove, {
      taskId,
    })

    const result = await t.query(api.task.get, {
      taskId,
    })

    expect(result).toBeNull()
  })

  test('get returns task members', async () => {
    const task = await t.query(api.task.get, {
      taskId,
    })

    expect(task?.members.length).toBe(2)

    expect(task?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: 'emp-1',
        }),
        expect.objectContaining({
          employeeId: 'emp-2',
        }),
      ]),
    )
  })
  test('list returns tasks', async () => {
    const tasks = await t.query(api.task.list, { trackId })

    expect(tasks.length).toBeGreaterThan(0)

    expect(tasks[0]?.title).toBe('Initial Task')
  })

  test('list returns empty array if there are no tasks', async () => {
    const isolated = createTestClient({
      userId: 'user-2',
      orgId: 'org-2',
    })

    const emptyProjectId = await isolated.mutation(api.project.create, {
      name: 'Empty Project',
      summary: 'No tasks',
      icon: '📁',
      color: 'purple',
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: 'active',
    })

    const emptyTrackId = await isolated.mutation(api.track.create, {
      name: 'Empty Track',
      description: 'No tasks',
      projectId: emptyProjectId,
      trackCode: 'TR-002',
      trackLeaderID: 'emp-1',
      status: 'active',
    })

    const tasks = await isolated.query(api.task.list, { trackId: emptyTrackId })

    expect(tasks).toEqual([])
  })
  // --------------------
  // UPDATE
  // --------------------
  test('update task status to backlog', async () => {
    await t.mutation(api.task.update, {
      taskId,
      body: { status: 'backlog' },
    })

    const task = await t.query(api.task.get, { taskId })
    expect(task?.status).toBe('backlog')
  })

  test('update task fields', async () => {
    await t.mutation(api.task.update, {
      taskId,
      body: {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'done',
        priority: 'high',
        complexity: 'hard',
      },
    })

    const updated = await t.query(api.task.get, {
      taskId,
    })

    expect(updated?.title).toBe('Updated Task')
    expect(updated?.description).toBe('Updated description')
    expect(updated?.status).toBe('done')
    expect(updated?.priority).toBe('high')
    expect(updated?.complexity).toBe('hard')
    expect(updated?.updatedAt).toBeTypeOf('number')
  })

  test('update throws if task title is empty', async () => {
    await expect(
      t.mutation(api.task.update, {
        taskId,
        body: {
          title: '   ',
        },
      }),
    ).rejects.toThrow('Task title cannot be empty')
  })

  test('update throws if task not found', async () => {
    await t.mutation(api.task.remove, {
      taskId,
    })

    await expect(
      t.mutation(api.task.update, {
        taskId,
        body: {
          title: 'Updated',
        },
      }),
    ).rejects.toThrow('Task not found')
  })

  // --------------------
  // REMOVE
  // --------------------
  test('remove deletes task', async () => {
    await t.mutation(api.task.remove, {
      taskId,
    })

    const deleted = await t.query(api.task.get, {
      taskId,
    })

    expect(deleted).toBeNull()
  })

  test('remove throws if task not found', async () => {
    await t.mutation(api.task.remove, {
      taskId,
    })

    await expect(
      t.mutation(api.task.remove, {
        taskId,
      }),
    ).rejects.toThrow('Task not found')
  })

  // --------------------
  // TRIMMING
  // --------------------
  test('create trims task title', async () => {
    const newTaskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      title: '   Trimmed Task   ',
      description: 'Test',
      status: 'todo',
      priority: 'low',
      complexity: 'easy',
      dueDate: 1,
    })

    const task = await t.query(api.task.get, {
      taskId: newTaskId,
    })

    expect(task?.title).toBe('Trimmed Task')
  })

  test('create sets statusOrder', async () => {
    const task = await t.query(api.task.get, { taskId })
    expect(task?.statusOrder).toBe(0)
  })

  test('list returns tasks sorted by statusOrder for kanban', async () => {
    const tasks = await t.query(api.task.list, { trackId })
    expect(tasks.length).toBeGreaterThan(0)
    expect(tasks[0]?.title).toBe('Initial Task')
  })

  test('list filters by assignee OR', async () => {
    const secondId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      title: 'Second Task',
      status: 'backlog',
      priority: 'low',
      complexity: 'easy',
    })

    await t.mutation(api.taskMember.toggleMember, {
      taskId,
      employeeId: 'emp-1',
    })
    await t.mutation(api.taskMember.toggleMember, {
      taskId: secondId,
      employeeId: 'emp-2',
    })

    const byEmp1 = await t.query(api.task.list, {
      trackId,
      assigneeIds: ['emp-1'],
    })
    expect(byEmp1.some((task) => task._id === taskId)).toBe(true)
    expect(byEmp1.some((task) => task._id === secondId)).toBe(false)

    const byEither = await t.query(api.task.list, {
      trackId,
      assigneeIds: ['emp-1', 'emp-2'],
    })
    expect(byEither.some((task) => task._id === taskId)).toBe(true)
    expect(byEither.some((task) => task._id === secondId)).toBe(true)
  })

  test('list filters by label OR', async () => {
    const labelA = await t.mutation(api.label.create, {
      projectId,
      name: 'Bug',
      color: '#f00',
    })
    const labelB = await t.mutation(api.label.create, {
      projectId,
      name: 'Feature',
      color: '#0f0',
    })
    const secondId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      title: 'Labeled Task',
      status: 'backlog',
      priority: 'low',
      complexity: 'easy',
    })

    await t.mutation(api.label.attachToTask, {
      taskId,
      labelId: labelA,
      deviceName: 'test',
    })
    await t.mutation(api.label.attachToTask, {
      taskId: secondId,
      labelId: labelB,
      deviceName: 'test',
    })

    const byA = await t.query(api.task.list, {
      trackId,
      labelIds: [labelA],
    })
    expect(byA.some((task) => task._id === taskId)).toBe(true)
    expect(byA.some((task) => task._id === secondId)).toBe(false)

    const byEither = await t.query(api.task.list, {
      trackId,
      labelIds: [labelA, labelB],
    })
    expect(byEither.some((task) => task._id === taskId)).toBe(true)
    expect(byEither.some((task) => task._id === secondId)).toBe(true)
  })

  test('list filters overdue and no due date', async () => {
    const todayStart = startOfDay(new Date()).getTime()
    const overdue = await t.query(api.task.list, {
      trackId,
      dueTo: todayStart - 1,
    })
    expect(overdue.some((task) => task._id === taskId)).toBe(true)

    const noDueId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      title: 'No due date',
      status: 'backlog',
      priority: 'low',
      complexity: 'easy',
    })

    const noDueOnly = await t.query(api.task.list, {
      trackId,
      noDueDate: true,
    })
    expect(noDueOnly.some((task) => task._id === noDueId)).toBe(true)
    expect(noDueOnly.some((task) => task._id === taskId)).toBe(false)
  })

  test('list filters by statuses OR', async () => {
    await t.mutation(api.task.update, {
      taskId,
      body: { status: 'done' },
    })

    const filtered = await t.query(api.task.list, {
      trackId,
      statuses: ['done', 'backlog'],
    })
    expect(
      filtered.every((task) => ['done', 'backlog'].includes(task.status)),
    ).toBe(true)
    expect(filtered.some((task) => task._id === taskId)).toBe(true)
  })

  test('reorderKanban moves task within column', async () => {
    const secondId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      title: 'Second Task',
      status: 'todo',
      priority: 'medium',
      complexity: 'easy',
    })

    await t.mutation(api.task.reorderKanban, {
      taskId: secondId,
      status: 'todo',
      statusOrder: 0,
    })

    const tasks = await t.query(api.task.list, { trackId })
    const todoTasks = tasks.filter((task) => task.status === 'todo')
    expect(todoTasks[0]?._id).toBe(secondId)
  })

  test('reorderKanban moves task between columns', async () => {
    await t.mutation(api.task.reorderKanban, {
      taskId,
      status: 'in_progress',
      statusOrder: 0,
    })

    const task = await t.query(api.task.get, { taskId })
    expect(task?.status).toBe('in_progress')
    expect(task?.statusOrder).toBe(0)
  })
})
