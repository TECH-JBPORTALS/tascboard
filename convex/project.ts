import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { organizationMutation, privateQuery } from './lib/customFunctions'
import { getProjectMembers } from './lib/memberHelper'
import { formatProjectDate, logProjectActivity } from './lib/projectActivityLog'
import { ProjectValidator } from './schema'
import { EMPTY_PROSEMIRROR_DOC, getProjectEditorId } from './syncEditor'
import { removeTrackCascade } from './track'

export const create = organizationMutation({
  args: ProjectValidator.omit(
    'organizationId',
    'description',
    'createdAt',
    'updatedAt',
  ),

  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId, user } = ctx.session
    if (args.endDate < args.startDate) {
      throw new Error('End date cannot be before start date')
    }
    const insertedProjectId = await ctx.db.insert('projects', {
      organizationId: orgId,
      name: args.name.trim(),
      summary: args.summary?.trim() || undefined,
      icon: args.icon,
      color: args.color,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      createdAt: Date.now(),
    })
    await ctx.runMutation(internal.syncEditor.createEditor, {
      id: getProjectEditorId(insertedProjectId),
      content: EMPTY_PROSEMIRROR_DOC,
    })
    await logProjectActivity(ctx, {
      projectId: insertedProjectId,
      organizationId: orgId,
      actorUserId: userId,
      actorName: user.name,
      kind: 'created',
      toValue: args.name.trim(),
    })
    return insertedProjectId
  },
})

export const list = privateQuery({
  args: {},
  handler: async (ctx) => {
    const { activeOrganizationId: orgId } = ctx.session
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId!))
      .order('desc')
      .collect()

    return await Promise.all(
      projects.map(async (project) => ({
        ...project,
        tracks: await ctx.db
          .query('tracks')
          .withIndex('by_project', (q) => q.eq('projectId', project._id))
          .collect(),
      })),
    )
  },
})

export const get = privateQuery({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    const project = await ctx.db.get(args.projectId)
    if (!project || project.organizationId !== orgId) {
      return null
    }
    const content = await ctx.runQuery(
      components.prosemirrorSync.lib.getSnapshot,
      { id: getProjectEditorId(args.projectId) },
    )
    const { members, manager } = await getProjectMembers(ctx, project._id)
    return {
      ...{ ...project, description: content },
      members,
      manager,
    }
  },
})

export const update = organizationMutation({
  args: {
    projectId: v.id('projects'),
    body: ProjectValidator.omit(
      'organizationId',
      'description',
      'createdAt',
      'updatedAt',
    ).partial(),
  },
  handler: async (ctx, args) => {
    const { userId, user, activeOrganizationId: orgId } = ctx.session
    const actorName = user.name

    const project = await ctx.db.get(args.projectId)

    if (!project || project.organizationId !== orgId) {
      throw new Error('Not found')
    }
    const nextStartDate = args.body.startDate ?? project.startDate
    const nextEndDate = args.body.endDate ?? project.endDate

    if (nextEndDate < nextStartDate) {
      throw new Error('End date cannot be before start date')
    }

    const patch: Partial<Doc<'projects'>> = {}

    if (args.body.name !== undefined) {
      const trimmed = args.body.name.trim()

      if (trimmed.length === 0) {
        throw new Error('Project name cannot be empty')
      }
      if (trimmed !== project.name) {
        await logProjectActivity(ctx, {
          projectId: args.projectId,
          organizationId: orgId,
          actorUserId: userId,
          actorName,
          kind: 'name_changed',
          fromValue: project.name,
          toValue: trimmed,
        })
      }

      patch.name = trimmed
    }

    if (args.body.summary !== undefined) {
      const trimmed = args.body.summary.trim()
      const nextSummary = trimmed.length > 0 ? trimmed : undefined

      if (nextSummary !== (project.summary ?? undefined)) {
        await logProjectActivity(ctx, {
          projectId: args.projectId,
          organizationId: orgId,
          actorUserId: userId,
          actorName,
          kind: 'summary_changed',
          fromValue: project.summary,
          toValue: nextSummary,
        })
      }

      patch.summary = nextSummary
    }

    if (args.body.status !== undefined && args.body.status !== project.status) {
      await logProjectActivity(ctx, {
        projectId: args.projectId,
        organizationId: orgId,
        actorUserId: userId,
        actorName,
        kind: 'status_changed',
        fromValue: project.status,
        toValue: args.body.status,
      })
      patch.status = args.body.status
    }

    if (
      args.body.startDate !== undefined &&
      args.body.startDate !== project.startDate
    ) {
      await logProjectActivity(ctx, {
        projectId: args.projectId,
        organizationId: orgId,
        actorUserId: userId,
        actorName,
        kind: 'start_date_changed',
        fromValue: formatProjectDate(project.startDate),
        toValue: formatProjectDate(args.body.startDate),
      })
      patch.startDate = args.body.startDate
    }

    if (
      args.body.endDate !== undefined &&
      args.body.endDate !== project.endDate
    ) {
      await logProjectActivity(ctx, {
        projectId: args.projectId,
        organizationId: orgId,
        actorUserId: userId,
        actorName,
        kind: 'end_date_changed',
        fromValue: formatProjectDate(project.endDate),
        toValue: formatProjectDate(args.body.endDate),
      })
      patch.endDate = args.body.endDate
    }

    if (args.body.icon !== undefined && args.body.icon !== project.icon) {
      await logProjectActivity(ctx, {
        projectId: args.projectId,
        organizationId: orgId,
        actorUserId: userId,
        actorName,
        kind: 'icon_changed',
        fromValue: project.icon,
        toValue: args.body.icon,
      })
      patch.icon = args.body.icon
    }

    if (args.body.color !== undefined && args.body.color !== project.color) {
      await logProjectActivity(ctx, {
        projectId: args.projectId,
        organizationId: orgId,
        actorUserId: userId,
        actorName,
        kind: 'color_changed',
        fromValue: project.color,
        toValue: args.body.color,
      })
      patch.color = args.body.color
    }

    if (Object.keys(patch).length === 0) {
      return null
    }

    patch.updatedAt = Date.now()

    await ctx.db.patch(args.projectId, patch)

    return null
  },
})

export const updateDescription = organizationMutation({
  args: {
    projectId: v.id('projects'),
    description: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session

    const project = await ctx.db.get(args.projectId)

    if (!project || project.organizationId !== orgId) {
      throw new Error('Not found')
    }

    await ctx.db.patch(args.projectId, {
      description: args.description,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const remove = organizationMutation({
  args: {
    projectId: v.id('projects'),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId)
    const { activeOrganizationId: orgId } = ctx.session

    if (!project || project.organizationId !== orgId) {
      throw new Error('Not found')
    }

    const tracks = await ctx.db
      .query('tracks')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect()

    for (const track of tracks) {
      await removeTrackCascade(ctx, track._id)
    }

    const labels = await ctx.db
      .query('labels')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect()

    await Promise.all(labels.map((label) => ctx.db.delete(label._id)))

    const editorId = getProjectEditorId(args.projectId)
    const latestVersion = await ctx.runQuery(
      components.prosemirrorSync.lib.latestVersion,
      {
        id: editorId,
      },
    )

    if (latestVersion !== null) {
      await ctx.runMutation(components.prosemirrorSync.lib.deleteDocument, {
        id: editorId,
      })
    }

    await ctx.db.delete(args.projectId)

    return {
      success: true,
      message: 'Project deleted successfully',
    }
  },
})

/** Idempotent seed so new organizations have starter projects */
export const seedStarterProjects = organizationMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { activeOrganizationId: orgId } = ctx.session
    const existing = await ctx.db
      .query('projects')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId))
      .take(1)

    if (existing.length > 0) {
      return null
    }

    const now = Date.now()

    const samples: Omit<Doc<'projects'>, '_id' | '_creationTime'>[] = [
      {
        organizationId: orgId,
        name: 'Employee Attendance System',
        summary: 'Track employee attendance and manage reporting workflows.',
        icon: '📊',
        color: 'blue',
        startDate: now,
        endDate: now + 1000 * 60 * 60 * 24 * 30,
        status: 'active',
        createdAt: now,
        updatedAt: undefined,
      },
      {
        organizationId: orgId,
        name: 'Payroll Automation',
        summary: 'Automate salary generation and payroll exports.',
        icon: '💎',
        color: 'purple',
        startDate: now,
        endDate: now + 1000 * 60 * 60 * 24 * 60,
        status: 'inactive',
        createdAt: now,
        updatedAt: undefined,
      },
    ]

    for (const row of samples) {
      const insertedProjectId = await ctx.db.insert('projects', row)
      await ctx.runMutation(internal.syncEditor.createEditor, {
        id: getProjectEditorId(insertedProjectId),
        content: EMPTY_PROSEMIRROR_DOC,
      })
    }

    return null
  },
})
