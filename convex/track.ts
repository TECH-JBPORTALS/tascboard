import type { Doc, Id } from './_generated/dataModel'
import { MutationCtx } from './_generated/server'
import {
  organizationMutation,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'
import { getTrackMembers } from './lib/memberHelper'
import { vv } from './schema'
import { removeTaskCascade } from './task'
// -------------------- CREATE --------------------
export const create = organizationMutation({
  args: vv.doc('tracks').omit('_id', '_creationTime', 'createdAt', 'updatedAt'),
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    const project = await ctx.db.get(args.projectId)
    if (!project || project.organizationId !== orgId) {
      throw new Error('Not found')
    }
    return await ctx.db.insert('tracks', {
      name: args.name.trim(),
      description: args.description?.trim(),
      projectId: args.projectId,
      trackCode: args.trackCode,
      trackLeaderID: args.trackLeaderID,
      status: args.status,
      createdAt: Date.now(),
    })
  },
})

// -------------------- LIST BY PROJECT --------------------
export const listByProject = privateQuery({
  args: {
    projectId: vv.id('projects'),
  },
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session

    const project = await ctx.db.get(args.projectId)
    if (!project || project.organizationId !== orgId) {
      throw new Error('Not found')
    }

    return await ctx.db
      .query('tracks')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect()
  },
})

// -------------------- GET --------------------
export const get = privateQuery({
  args: {
    trackId: vv.id('tracks'),
  },
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.trackId)

    if (!track) return null
    const { members, lead } = await getTrackMembers(ctx, track._id)

    return {
      ...track,
      members,
      lead,
    }
  },
})

// -------------------- UPDATE --------------------
export const update = privateMutation({
  args: {
    trackId: vv.id('tracks'),
    body: vv
      .doc('tracks')
      .omit('_id', '_creationTime', 'projectId', 'createdAt', 'updatedAt')
      .partial(),
  },
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.trackId)

    if (!track) {
      throw new Error('Track not found')
    }

    const patch: Partial<Doc<'tracks'>> = {}

    if (args.body.name !== undefined) {
      const trimmed = args.body.name.trim()
      if (!trimmed) {
        throw new Error('Track name cannot be empty')
      }
      patch.name = trimmed
    }

    if (args.body.description !== undefined) {
      patch.description = args.body.description.trim()
    }

    if (args.body.trackCode !== undefined) {
      patch.trackCode = args.body.trackCode
    }

    if (args.body.trackLeaderID !== undefined) {
      patch.trackLeaderID = args.body.trackLeaderID
    }

    if (args.body.status !== undefined) {
      patch.status = args.body.status
    }
    if (Object.keys(patch).length === 0) {
      return null
    }
    patch.updatedAt = Date.now()

    await ctx.db.patch(args.trackId, patch)

    return null
  },
})

// -------------------- CASCADE DELETE --------------------
export async function removeTrackCascade(
  ctx: MutationCtx,
  trackId: Id<'tracks'>,
) {
  const sprints = await ctx.db
    .query('sprints')
    .withIndex('by_track', (q) => q.eq('trackId', trackId))
    .collect()
  for (const sprint of sprints) {
    await ctx.db.delete(sprint._id)
  }
  const tasks = await ctx.db
    .query('tasks')
    .withIndex('by_track', (q) => q.eq('trackId', trackId))
    .collect()
  for (const task of tasks) {
    await removeTaskCascade(ctx, task._id)
  }
  const members = await ctx.db
    .query('trackMember')
    .withIndex('by_track', (q) => q.eq('trackId', trackId))
    .collect()
  await Promise.all(members.map((member) => ctx.db.delete(member._id)))
  await ctx.db.delete(trackId)
}

// -------------------- REMOVE --------------------
export const remove = privateMutation({
  args: {
    trackId: vv.id('tracks'),
  },
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.trackId)
    if (!track) {
      throw new Error('Track not found')
    }
    await removeTrackCascade(ctx, args.trackId)
    return null
  },
})
