import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { removeTrackCascade } from "./track";
import { requireIdentity, requireOrganization } from "./lib/auth";
import {
  actorDisplayName,
  formatProjectDate,
  logProjectActivity,
} from "./lib/projectActivityLog";
import { projectColorValidator } from "./lib/projectAppearance";
import { getProjectMembers } from "./lib/memberHelper";
import { components, internal } from "./_generated/api";
import { EMPTY_PROSEMIRROR_DOC, getProjectEditorId } from "./syncEditor";

const projectStatusValidator = v.union(
  v.literal("active"),
  v.literal("inactive"),
  v.literal("terminated"),
);

const projectReturn = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  organizationId: v.string(),
  name: v.string(),
  summary: v.optional(v.string()),
  description: v.optional(v.any()),
  icon: v.optional(v.string()),
  color: v.optional(projectColorValidator),
  startDate: v.number(),
  endDate: v.number(),
  status: projectStatusValidator,
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const create = mutation({
  args: {
    name: v.string(),
    summary: v.optional(v.string()),
    icon: v.string(),
    color: projectColorValidator,
    startDate: v.number(),
    endDate: v.number(),
    status: projectStatusValidator,
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const { orgId, userId } = await requireOrganization(ctx);

    if (args.endDate < args.startDate) {
      throw new Error("End date cannot be before start date");
    }

    const now = Date.now();

    const insertedProjectId = await ctx.db.insert("projects", {
      organizationId: orgId,
      name: args.name.trim(),
      summary: args.summary?.trim() || undefined,
      icon: args.icon,
      color: args.color,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      createdAt: now,
      updatedAt: undefined,
    });

    await ctx.runMutation(internal.syncEditor.createEditor, {
      id: getProjectEditorId(insertedProjectId),
      content: EMPTY_PROSEMIRROR_DOC,
    });

    await logProjectActivity(ctx, {
      projectId: insertedProjectId,
      organizationId: orgId,
      actorUserId: userId,
      actorName: actorDisplayName(identity),
      kind: "created",
      toValue: args.name.trim(),
    });

    return insertedProjectId;
  },
});

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      ...projectReturn.fields,
      tracks: v.array(v.any()),
    }),
  ),
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const { orgId } = await requireOrganization(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .collect();

    return await Promise.all(
      projects.map(async (project) => ({
        ...project,
        tracks: await ctx.db
          .query("tracks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect(),
      })),
    );
  },
});

export const get = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.union(
    v.object({
      ...projectReturn.fields,

      members: v.array(
        v.object({
          _id: v.id("projectMember"),
          employeeId: v.string(),
        }),
      ),

      manager: v.union(
        v.object({
          _id: v.id("projectMember"),
          employeeId: v.string(),
        }),
        v.null(),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const { orgId } = await requireOrganization(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== orgId) {
      return null;
    }

    const content = await ctx.runQuery(
      components.prosemirrorSync.lib.getSnapshot,
      { id: getProjectEditorId(args.projectId) },
    );

    const { members, manager } = await getProjectMembers(ctx, project._id);

    return {
      ...{ ...project, description: content },
      members,
      manager,
    };
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    body: v.object({
      name: v.optional(v.string()),
      summary: v.optional(v.string()),
      icon: v.optional(v.string()),
      color: v.optional(projectColorValidator),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      status: v.optional(projectStatusValidator),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const { orgId, userId } = await requireOrganization(ctx);
    const actorName = actorDisplayName(identity);

    const project = await ctx.db.get(args.projectId);

    if (!project || project.organizationId !== orgId) {
      throw new Error("Not found");
    }

    const nextStartDate = args.body.startDate ?? project.startDate;
    const nextEndDate = args.body.endDate ?? project.endDate;

    if (nextEndDate < nextStartDate) {
      throw new Error("End date cannot be before start date");
    }

    const patch: Partial<Doc<"projects">> = {};

    if (args.body.name !== undefined) {
      const trimmed = args.body.name.trim();

      if (trimmed.length === 0) {
        throw new Error("Project name cannot be empty");
      }

      if (trimmed !== project.name) {
        await logProjectActivity(ctx, {
          projectId: args.projectId,
          organizationId: orgId,
          actorUserId: userId,
          actorName,
          kind: "name_changed",
          fromValue: project.name,
          toValue: trimmed,
        });
      }

      patch.name = trimmed;
    }

    if (args.body.summary !== undefined) {
      const trimmed = args.body.summary.trim();
      const nextSummary = trimmed.length > 0 ? trimmed : undefined;

      if (nextSummary !== (project.summary ?? undefined)) {
        await logProjectActivity(ctx, {
          projectId: args.projectId,
          organizationId: orgId,
          actorUserId: userId,
          actorName,
          kind: "summary_changed",
          fromValue: project.summary,
          toValue: nextSummary,
        });
      }

      patch.summary = nextSummary;
    }

    if (args.body.status !== undefined && args.body.status !== project.status) {
      await logProjectActivity(ctx, {
        projectId: args.projectId,
        organizationId: orgId,
        actorUserId: userId,
        actorName,
        kind: "status_changed",
        fromValue: project.status,
        toValue: args.body.status,
      });
      patch.status = args.body.status;
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
        kind: "start_date_changed",
        fromValue: formatProjectDate(project.startDate),
        toValue: formatProjectDate(args.body.startDate),
      });
      patch.startDate = args.body.startDate;
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
        kind: "end_date_changed",
        fromValue: formatProjectDate(project.endDate),
        toValue: formatProjectDate(args.body.endDate),
      });
      patch.endDate = args.body.endDate;
    }

    if (args.body.icon !== undefined && args.body.icon !== project.icon) {
      await logProjectActivity(ctx, {
        projectId: args.projectId,
        organizationId: orgId,
        actorUserId: userId,
        actorName,
        kind: "icon_changed",
        fromValue: project.icon,
        toValue: args.body.icon,
      });
      patch.icon = args.body.icon;
    }

    if (args.body.color !== undefined && args.body.color !== project.color) {
      await logProjectActivity(ctx, {
        projectId: args.projectId,
        organizationId: orgId,
        actorUserId: userId,
        actorName,
        kind: "color_changed",
        fromValue: project.color,
        toValue: args.body.color,
      });
      patch.color = args.body.color;
    }

    if (Object.keys(patch).length === 0) {
      return null;
    }

    patch.updatedAt = Date.now();

    await ctx.db.patch(args.projectId, patch);

    return null;
  },
});

export const updateDescription = mutation({
  args: {
    projectId: v.id("projects"),
    description: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const { orgId } = await requireOrganization(ctx);

    const project = await ctx.db.get(args.projectId);

    if (!project || project.organizationId !== orgId) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.projectId, {
      description: args.description,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const project = await ctx.db.get(args.projectId);
    const { orgId } = await requireOrganization(ctx);

    if (!project || project.organizationId !== orgId) {
      throw new Error("Not found");
    }

    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const track of tracks) {
      await removeTrackCascade(ctx, track._id);
    }

    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    await Promise.all(labels.map((label) => ctx.db.delete(label._id)));

    const editorId = getProjectEditorId(args.projectId);
    const latestVersion = await ctx.runQuery(
      components.prosemirrorSync.lib.latestVersion,
      {
        id: editorId,
      },
    );

    if (latestVersion !== null) {
      await ctx.runMutation(components.prosemirrorSync.lib.deleteDocument, {
        id: editorId,
      });
    }

    await ctx.db.delete(args.projectId);

    return {
      success: true,
      message: "Project deleted successfully",
    };
  },
});

/** Idempotent seed so new organizations have starter projects */
export const seedStarterProjects = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { orgId } = await requireOrganization(ctx);

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .take(1);

    if (existing.length > 0) {
      return null;
    }

    const now = Date.now();

    const samples: Omit<Doc<"projects">, "_id" | "_creationTime">[] = [
      {
        organizationId: orgId,
        name: "Employee Attendance System",
        summary: "Track employee attendance and manage reporting workflows.",
        icon: "📊",
        color: "blue",
        startDate: now,
        endDate: now + 1000 * 60 * 60 * 24 * 30,
        status: "active",
        createdAt: now,
        updatedAt: undefined,
      },
      {
        organizationId: orgId,
        name: "Payroll Automation",
        summary: "Automate salary generation and payroll exports.",
        icon: "💎",
        color: "purple",
        startDate: now,
        endDate: now + 1000 * 60 * 60 * 24 * 60,
        status: "inactive",
        createdAt: now,
        updatedAt: undefined,
      },
    ];

    for (const row of samples) {
      const insertedProjectId = await ctx.db.insert("projects", row);
      await ctx.runMutation(internal.syncEditor.createEditor, {
        id: getProjectEditorId(insertedProjectId),
        content: EMPTY_PROSEMIRROR_DOC,
      });
    }

    return null;
  },
});
