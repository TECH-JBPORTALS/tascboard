import { beforeEach, describe, expect, test, vi } from 'bun:test'

vi.mock('../lib/customFunctions', async () => {
  const { customCtx, customMutation, customQuery } = await import(
    'convex-helpers/server/customFunctions'
  )
  const {
    internalMutation,
    internalQuery,
    mutation,
    query,
  } = await import('../_generated/server')
  const { buildMockSession } = await import('./testAuthSession')

  const privateQuery = customQuery(
    query,
    customCtx(async (ctx) => ({ ...ctx, session: buildMockSession() })),
  )
  const privateMutation = customMutation(
    mutation,
    customCtx(async (ctx) => ({ ...ctx, session: buildMockSession() })),
  )
  const organizationQuery = customQuery(
    privateQuery,
    customCtx(async (ctx) => ({ ...ctx, session: buildMockSession() })),
  )
  const organizationMutation = customMutation(
    privateMutation,
    customCtx(async (ctx) => ({ ...ctx, session: buildMockSession() })),
  )
  const privateInternalQuery = customQuery(
    internalQuery,
    customCtx(async (ctx) => ({ ...ctx, session: buildMockSession() })),
  )
  const privateInternalMutation = customMutation(
    internalMutation,
    customCtx(async (ctx) => ({ ...ctx, session: buildMockSession() })),
  )
  const organizationInternalQuery = customQuery(
    privateQuery,
    customCtx(async (ctx) => ({ ...ctx, session: buildMockSession() })),
  )
  const organizationInternalMutation = customMutation(
    privateInternalMutation,
    customCtx(async (ctx) => ({ ...ctx, session: buildMockSession() })),
  )

  return {
    validateSession: async () => buildMockSession(),
    validateActiveOrganization: async () => buildMockSession(),
    privateQuery,
    privateMutation,
    privateInternalQuery,
    privateInternalMutation,
    organizationQuery,
    organizationMutation,
    organizationInternalQuery,
    organizationInternalMutation,
  }
})

import { convexTest, TestConvexForDataModel } from 'convex-test'

import { api } from '../_generated/api'
import { DataModel, Id } from '../_generated/dataModel'
import schema from '../schema'
import { modules } from './_modules.test'
import { registerProsemirrorSyncComponent } from './registerComponents.test'
import { resetMockEmployee, setMockEmployee } from './testAuthSession'

function createTestClient() {
  const base = convexTest(schema, modules)
  registerProsemirrorSyncComponent(base)
  return base
}

describe('Resource membership list filtering', () => {
  let t: TestConvexForDataModel<DataModel>
  let projectId: Id<'projects'>
  let memberTrackId: Id<'tracks'>
  let otherTrackId: Id<'tracks'>
  let memberTaskId: Id<'tasks'>
  let otherTaskId: Id<'tasks'>

  beforeEach(async () => {
    resetMockEmployee()
    setMockEmployee({ id: 'emp-owner', role: 'owner' })
    t = createTestClient()

    projectId = await t.mutation(api.project.create, {
      name: 'Membership Project',
      summary: 'Test project',
      icon: '📁',
      color: 'purple',
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: 'active',
    })

    memberTrackId = await t.mutation(api.track.create, {
      name: 'Member Track',
      description: 'Visible to member',
      projectId,
      trackCode: 'TR-001',
      trackLeaderID: 'emp-member',
      status: 'active',
    })

    otherTrackId = await t.mutation(api.track.create, {
      name: 'Other Track',
      description: 'Hidden from member',
      projectId,
      trackCode: 'TR-002',
      trackLeaderID: 'emp-other',
      status: 'active',
    })

    memberTaskId = await t.mutation(api.task.create, {
      trackId: memberTrackId,
      projectId,
      title: 'Member Task',
      description: 'Visible to member',
      status: 'todo',
      priority: 'medium',
      complexity: 'easy',
      dueDate: 1700000000000,
    })

    otherTaskId = await t.mutation(api.task.create, {
      trackId: memberTrackId,
      projectId,
      title: 'Other Task',
      description: 'Hidden from member',
      status: 'todo',
      priority: 'medium',
      complexity: 'easy',
      dueDate: 1700000000000,
    })

    await t.mutation(api.projectMember.toggleMember, {
      projectId,
      employeeId: 'emp-member',
    })

    await t.mutation(api.trackMember.toggleMember, {
      trackId: memberTrackId,
      employeeId: 'emp-member',
    })

    await t.mutation(api.taskMember.toggleMember, {
      taskId: memberTaskId,
      employeeId: 'emp-member',
    })
  })

  test('org owner sees all projects, tracks, and tasks', async () => {
    const projects = await t.query(api.project.list, {})
    expect(projects).toHaveLength(1)
    expect(projects[0]?.tracks).toHaveLength(2)

    const tracks = await t.query(api.track.listByProject, { projectId })
    expect(tracks).toHaveLength(2)

    const tasks = await t.query(api.task.list, { trackId: memberTrackId })
    expect(tasks).toHaveLength(2)
  })

  test('employee sees only member projects and member nested tracks', async () => {
    setMockEmployee({ id: 'emp-member', role: 'employee' })

    const projects = await t.query(api.project.list, {})
    expect(projects).toHaveLength(1)
    expect(projects[0]?._id).toBe(projectId)
    expect(projects[0]?.tracks).toHaveLength(1)
    expect(projects[0]?.tracks[0]?._id).toBe(memberTrackId)
  })

  test('employee without project membership sees no projects', async () => {
    setMockEmployee({ id: 'emp-outsider', role: 'employee' })

    const projects = await t.query(api.project.list, {})
    expect(projects).toHaveLength(0)
  })

  test('employee sees only member tracks in listByProject', async () => {
    setMockEmployee({ id: 'emp-member', role: 'employee' })

    const tracks = await t.query(api.track.listByProject, { projectId })
    expect(tracks).toHaveLength(1)
    expect(tracks[0]?._id).toBe(memberTrackId)
    expect(tracks.some((track) => track._id === otherTrackId)).toBe(false)
  })

  test('employee sees only member tasks in task.list', async () => {
    setMockEmployee({ id: 'emp-member', role: 'employee' })

    const tasks = await t.query(api.task.list, { trackId: memberTrackId })
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?._id).toBe(memberTaskId)
    expect(tasks.some((task) => task._id === otherTaskId)).toBe(false)
  })

  test('employee sees only member tasks in task.listByTrack', async () => {
    setMockEmployee({ id: 'emp-member', role: 'employee' })

    const tasks = await t.query(api.task.listByTrack, {
      trackId: memberTrackId,
    })
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?._id).toBe(memberTaskId)
  })
})
