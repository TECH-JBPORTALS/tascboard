import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { removeTrackCascade } from "./track";
import { requireIdentity, requireOrganization } from "./lib/auth";
import { projectColorValidator } from "./lib/projectAppearance";

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

type ProjectDoc = Doc<"projects"> & { docContent?: unknown };

/** Maps legacy docContent / string description into summary + rich description. */
function normalizeProject(project: ProjectDoc) {
  let summary = project.summary;
  let description = project.description;

  if (description === undefined && project.docContent !== undefined) {
    description = project.docContent;
  }

  if (typeof description === "string") {
    if (!summary) {
      summary = description;
    }
    description = undefined;
  }

  return { ...project, summary, description };
}

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
    await requireIdentity(ctx);
    const { orgId } = await requireOrganization(ctx);
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
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const { orgId } = await requireOrganization(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .collect();

    return await Promise.all(
      projects.map(async (project) => ({
        ...normalizeProject(project as ProjectDoc),
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
  returns: v.union(projectReturn, v.null()),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const { orgId } = await requireOrganization(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== orgId) {
      return null;
    }
    return normalizeProject(project as ProjectDoc);
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
    await requireIdentity(ctx);
    const { orgId } = await requireOrganization(ctx);

    const project = await ctx.db.get(args.projectId);

    if (!project || project.organizationId !== orgId) {
      throw new Error("Not found");
    }

    const patch: Partial<Doc<"projects">> = {
      ...args.body,
    };

    if (args.body.name !== undefined) {
      const trimmed = args.body.name.trim();

      if (trimmed.length === 0) {
        throw new Error("Project name cannot be empty");
      }

      patch.name = trimmed;
    }

    if (args.body.summary !== undefined) {
      const trimmed = args.body.summary.trim();
      patch.summary = trimmed.length > 0 ? trimmed : undefined;
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
        summary:
          "Track employee attendance and manage reporting workflows.",
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
      await ctx.db.insert("projects", row);
    }

    return null;
  },
});
