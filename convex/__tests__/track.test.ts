import { beforeEach, describe, expect, test } from 'bun:test'
import { convexTest, TestConvexForDataModel } from 'convex-test'

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

describe('Tracks', () => {
  let t: TestConvexForDataModel<DataModel>
  let projectId: Id<'projects'>
  let trackId: Id<'tracks'>

  beforeEach(async () => {
    t = createTestClient({
      userId: 'user-1',
      orgId: 'org-1',
    })

    projectId = await t.mutation(api.project.create, {
      name: 'Project A',
      summary: 'Test project',
      icon: '📁',
      color: 'purple',
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: 'active',
    })

    trackId = await t.mutation(api.track.create, {
      name: 'Track A',
      description: 'Test track',
      projectId,
      trackCode: 'TR-001',
      trackLeaderID: 'emp-1',
      status: 'active',
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
  test('create track', async () => {
    const track = await t.query(api.track.get, {
      trackId,
    })

    expect(track).not.toBeNull()
    expect(track?.name).toBe('Track A')
    expect(track?.projectId).toBe(projectId)
    expect(track?.status).toBe('active')
  })

  // --------------------
  // CREATE FAIL (ORG CHECK)
  // --------------------
  test('create fails if project does not belong to org', async () => {
    const projectId = await t.mutation(api.project.create, {
      name: 'Valid Project',
      summary: 'Test',
      icon: '📁',
      color: 'purple',
      startDate: Date.now(),
      endDate: Date.now() + 100000,
      status: 'active',
    })

    // delete project → now it exists in DB structure but is invalid reference
    await t.mutation(api.project.remove, { projectId })

    await expect(
      t.mutation(api.track.create, {
        name: 'Track X',
        projectId,
        trackCode: 'TR-001',
        trackLeaderID: 'emp-1',
        status: 'active',
      }),
    ).rejects.toThrow('Not found')
  })
  // --------------------
  // GET
  // --------------------
  test('get returns track by id', async () => {
    const track = await t.query(api.track.get, {
      trackId,
    })

    expect(track?._id).toBe(trackId)
    expect(track?.name).toBe('Track A')
  })

  test('get returns null if not found', async () => {
    // create a real track first
    const tempTrackId = await t.mutation(api.track.create, {
      name: 'Temp Track',
      description: 'Will be deleted',
      projectId,
      trackCode: 'TMP-001',
      trackLeaderID: 'emp-1',
      status: 'active',
    })

    // delete it so it becomes "not found"
    await t.mutation(api.track.remove, {
      trackId: tempTrackId,
    })

    // now query deleted track
    const result = await t.query(api.track.get, {
      trackId: tempTrackId,
    })

    expect(result).toBeNull()
  })

  test('get returns track members and lead', async () => {
    const track = await t.query(api.track.get, {
      trackId,
    })

    expect(track?.members.length).toBe(2)

    expect(track?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: 'emp-1',
        }),
        expect.objectContaining({
          employeeId: 'emp-2',
        }),
      ]),
    )

    expect(track?.lead).toEqual(
      expect.objectContaining({
        employeeId: 'emp-1',
      }),
    )
  })
  // --------------------
  // UPDATE
  // --------------------
  test('update track name', async () => {
    await t.mutation(api.track.update, {
      trackId,
      body: {
        name: 'Updated Track',
      },
    })

    const updated = await t.query(api.track.get, {
      trackId,
    })

    expect(updated?.name).toBe('Updated Track')
  })

  test('update throws if track not found', async () => {
    const trackId = await t.mutation(api.track.create, {
      name: 'Temp Track',
      projectId,
      trackCode: 'TMP',
      trackLeaderID: 'emp-1',
      status: 'active',
    })

    await t.mutation(api.track.remove, { trackId })

    await expect(
      t.mutation(api.track.update, {
        trackId,
        body: { name: 'Updated' },
      }),
    ).rejects.toThrow('Track not found')
  })

  test('update throws if name is empty', async () => {
    await expect(
      t.mutation(api.track.update, {
        trackId,
        body: { name: '   ' },
      }),
    ).rejects.toThrow('Track name cannot be empty')
  })

  // --------------------
  // REMOVE
  // --------------------
  test('remove deletes track', async () => {
    await t.mutation(api.track.remove, {
      trackId,
    })

    const deleted = await t.query(api.track.get, {
      trackId,
    })

    expect(deleted).toBeNull()
  })

  test('remove throws if track not found', async () => {
    const trackId = await t.mutation(api.track.create, {
      name: 'Temp Track',
      projectId,
      trackCode: 'TMP',
      trackLeaderID: 'emp-1',
      status: 'active',
    })

    await t.mutation(api.track.remove, { trackId })

    await expect(
      t.mutation(api.track.remove, {
        trackId,
      }),
    ).rejects.toThrow('Track not found')
  })
})
