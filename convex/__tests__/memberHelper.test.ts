import { describe, expect, test } from 'bun:test'
import { convexTest } from 'convex-test'

import {
  getActiveEmployeeId,
  getMemberProjectIds,
  getMemberTaskIds,
  getMemberTrackIds,
  isOrgOwner,
} from '../lib/memberHelper'
import schema from '../schema'
import { modules } from './_modules.test'

describe('memberHelper access helpers', () => {
  test('getActiveEmployeeId reads id from employee session', () => {
    expect(
      getActiveEmployeeId({
        employee: { id: 'emp-abc', role: 'employee' },
      }),
    ).toBe('emp-abc')
  })

  test('getActiveEmployeeId falls back to _id', () => {
    expect(
      getActiveEmployeeId({
        employee: { _id: 'emp-legacy', role: 'employee' },
      }),
    ).toBe('emp-legacy')
  })

  test('isOrgOwner detects owner role', () => {
    expect(isOrgOwner({ employee: { id: 'emp-1', role: 'owner' } })).toBe(true)
    expect(isOrgOwner({ employee: { id: 'emp-1', role: 'employee' } })).toBe(
      false,
    )
  })

  test('membership id helpers return assigned resource ids', async () => {
    const t = convexTest(schema, modules)

    const { projectId, trackId, taskId } = await t.run(async (ctx) => {
      const projectId = await ctx.db.insert('projects', {
        organizationId: 'org-1',
        name: 'Project A',
        icon: '📁',
        color: 'blue',
        startDate: 1,
        endDate: 2,
        status: 'active',
        createdAt: Date.now(),
      })

      const trackId = await ctx.db.insert('tracks', {
        projectId,
        name: 'Track A',
        trackCode: 'TR-1',
        trackLeaderID: 'emp-lead',
        status: 'active',
        createdAt: Date.now(),
      })

      const taskId = await ctx.db.insert('tasks', {
        trackId,
        projectId,
        taskCode: '1',
        title: 'Task A',
        status: 'todo',
        statusOrder: 0,
        createdBy: 'user-1',
        priority: 'medium',
        complexity: 'easy',
        createdAt: Date.now(),
      })

      await ctx.db.insert('projectMember', {
        projectId,
        employeeId: 'emp-1',
        manager: false,
        assignedBy: 'user-1',
        createdAt: Date.now(),
      })

      await ctx.db.insert('trackMember', {
        trackId,
        employeeId: 'emp-1',
        lead: false,
        assignedAt: Date.now(),
        createdAt: Date.now(),
      })

      await ctx.db.insert('taskMember', {
        taskId,
        employeeId: 'emp-1',
        lead: false,
        assignedAt: Date.now(),
        createdAt: Date.now(),
      })

      return { projectId, trackId, taskId }
    })

    await t.run(async (ctx) => {
      const projectIds = await getMemberProjectIds(ctx, 'emp-1')
      const trackIds = await getMemberTrackIds(ctx, 'emp-1')
      const taskIds = await getMemberTaskIds(ctx, 'emp-1')

      expect(projectIds.has(projectId)).toBe(true)
      expect(trackIds.has(trackId)).toBe(true)
      expect(taskIds.has(taskId)).toBe(true)

      expect(projectIds.size).toBe(1)
      expect(trackIds.size).toBe(1)
      expect(taskIds.size).toBe(1)
    })
  })
})
