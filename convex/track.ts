import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { MutationCtx, mutation, query } from './_generated/server'
import { requireIdentity, requireOrganization } from './lib/auth'
import { getTrackMembers } from './lib/memberHelper'
import { removeTaskCascade } from './task'

const trackStatusValidator = v.union(
  v.literal('active'),
  v.literal('completed'),
  v.literal('archived'),
)

const trackReturn = v.object({
  _id: v.id('tracks'),
  _creationTime: v.number(),
  name: v.string(),
  description: v.optional(v.string()),
  projectId: v.id('projects'),
  trackCode: v.string(),
  trackLeaderID: v.string(),
  status: trackStatusValidator,
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

// -------------------- CREATE --------------------
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id('projects'),
    trackCode: v.string(),
    trackLeaderID: v.string(), // FIXED
    status: trackStatusValidator,
  },
  returns: v.id('tracks'),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const { orgId } = await requireOrganization(ctx)

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
      updatedAt: undefined,
    })
  },
})

// -------------------- LIST BY PROJECT --------------------
export const listByProject = query({
  args: {
    projectId: v.id('projects'),
  },
  returns: v.array(trackReturn),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const { orgId } = await requireOrganization(ctx)

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
export const get = query({
  args: {
    trackId: v.id('tracks'),
  },
  returns: v.union(
    v.object({
      ...trackReturn.fields,
      members: v.array(
        v.object({
          _id: v.id('trackMember'),
          employeeId: v.string(),
        }),
      ),
      lead: v.union(
        v.object({
          _id: v.id('trackMember'),
          employeeId: v.string(),
        }),
        v.null(),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

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
export const update = mutation({
  args: {
    trackId: v.id('tracks'),
    body: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      trackCode: v.optional(v.string()),
      trackLeaderID: v.optional(v.string()), // FIXED
      status: v.optional(trackStatusValidator),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

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

  await ctx.db.delete(trackId)
}

// -------------------- REMOVE --------------------
export const remove = mutation({
  args: {
    trackId: v.id('tracks'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const track = await ctx.db.get(args.trackId)

    if (!track) {
      throw new Error('Track not found')
    }

    await removeTrackCascade(ctx, args.trackId)

    return null
  },
})
