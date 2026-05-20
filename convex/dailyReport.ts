import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireIdentity, requireOrganization } from "./lib/auth";

const dailyReportReturn = v.object({
  _id: v.id("dailyReport"),
  _creationTime: v.number(),
  employeeId: v.string(),
  reportDate: v.number(),
  workSummary: v.string(),
  loginTime: v.string(),
  logoutTime: v.string(),
  reviewerId: v.string(),
  remark: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const dailyReportTaskTagReturn = v.object({
  _id: v.id("dailyReportTaskTag"),
  _creationTime: v.number(),
  reportId: v.id("dailyReport"),
  taskId: v.id("tasks"),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const create = mutation({
  args: {
    employeeId: v.string(),
    reportDate: v.number(),
    workSummary: v.string(),
    loginTime: v.string(),
    logoutTime: v.string(),
    reviewerId: v.string(),
    remark: v.string(),
  },

  returns: v.id("dailyReport"),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    await requireOrganization(ctx);

    const reportId = await ctx.db.insert("dailyReport", {
      ...args,
      createdAt: Date.now(),
    });

    return reportId;
  },
});

export const list = query({
  args: {},

  returns: v.array(dailyReportReturn),

  handler: async (ctx) => {
    await requireIdentity(ctx);
    await requireOrganization(ctx);

    return await ctx.db
      .query("dailyReport")
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: {
    reportId: v.id("dailyReport"),
  },

  returns: v.union(dailyReportReturn, v.null()),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const report = await ctx.db.get(args.reportId);

    if (!report) {
      return null;
    }

    return report;
  },
});

export const update = mutation({
  args: {
    reportId: v.id("dailyReport"),
    workSummary: v.optional(v.string()),
    loginTime: v.optional(v.string()),
    logoutTime: v.optional(v.string()),
    reviewerId: v.optional(v.string()),
    remark: v.optional(v.string()),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const { reportId, ...rest } = args;

    const report = await ctx.db.get(reportId);

    if (!report) {
      throw new Error("Daily report not found");
    }

    await ctx.db.patch(reportId, {
      ...rest,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    reportId: v.id("dailyReport"),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const report = await ctx.db.get(args.reportId);

    if (!report) {
      throw new Error("Daily report not found");
    }

    // Delete related task tags
    const tags = await ctx.db
      .query("dailyReportTaskTag")
      .withIndex("by_reportId", (q) =>
        q.eq("reportId", args.reportId)
      )
      .collect();

    for (const tag of tags) {
      await ctx.db.delete(tag._id);
    }

    await ctx.db.delete(args.reportId);

    return null;
  },
});

export const createTaskTag = mutation({
  args: {
    reportId: v.id("dailyReport"),
    taskId: v.id("tasks"),
  },

  returns: v.id("dailyReportTaskTag"),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const existing = await ctx.db
      .query("dailyReportTaskTag")
      .withIndex("by_reportId_taskId", (q) =>
        q
          .eq("reportId", args.reportId)
          .eq("taskId", args.taskId)
      )
      .unique();

    if (existing) {
      throw new Error("Task already tagged");
    }

    const tagId = await ctx.db.insert("dailyReportTaskTag", {
      ...args,
      createdAt: Date.now(),
    });

    return tagId;
  },
});

export const listTaskTags = query({
  args: {
    reportId: v.id("dailyReport"),
  },

  returns: v.array(dailyReportTaskTagReturn),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    return await ctx.db
      .query("dailyReportTaskTag")
      .withIndex("by_reportId", (q) =>
        q.eq("reportId", args.reportId)
      )
      .collect();
  },
});

export const updateTaskTag = mutation({
    args: {
      tagId: v.id("dailyReportTaskTag"),
      taskId: v.optional(v.id("tasks")),
      reportId: v.optional(v.id("dailyReport")),
    },
  
    returns: v.null(),
  
    handler: async (ctx, args) => {
      await requireIdentity(ctx);
  
      const tag = await ctx.db.get(args.tagId);
  
      if (!tag) {
        throw new Error("Task tag not found");
      }
  
      // If nothing is changing, just return
      if (!args.taskId && !args.reportId) {
        return null;
      }
  
      // If updating reportId + taskId together OR individually
      const updated: Partial<{
        reportId: any;
        taskId: any;
        updatedAt: number;
      }> = {
        updatedAt: Date.now(),
      };
  
      if (args.taskId) {
        updated.taskId = args.taskId;
      }
  
      if (args.reportId) {
        updated.reportId = args.reportId;
      }
  
      // Prevent duplicate (same reportId + taskId already exists)
      const finalReportId = args.reportId ?? tag.reportId;
      const finalTaskId = args.taskId ?? tag.taskId;
  
      const existing = await ctx.db
        .query("dailyReportTaskTag")
        .withIndex("by_reportId_taskId", (q) =>
          q.eq("reportId", finalReportId).eq("taskId", finalTaskId),
        )
        .unique();
  
      if (existing && existing._id !== args.tagId) {
        throw new Error("Task already tagged for this report");
      }
  
      await ctx.db.patch(args.tagId, updated);
  
      return null;
    },
  });

export const removeTaskTag = mutation({
  args: {
    tagId: v.id("dailyReportTaskTag"),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const tag = await ctx.db.get(args.tagId);

    if (!tag) {
      throw new Error("Task tag not found");
    }

    await ctx.db.delete(args.tagId);

    return null;
  },
});

export const seedDailyReports = mutation({
  args: {},

  returns: v.null(),

  handler: async (ctx) => {
    const { userId } = await requireIdentity(ctx);

    const existing = await ctx.db
      .query("dailyReport")
      .collect();

    if (existing.length > 0) {
      return null;
    }

    const samples: Omit<
      Doc<"dailyReport">,
      "_id" | "_creationTime"
    >[] = [
      {
        employeeId: userId,
        reportDate: Date.now(),
        workSummary:
          "Completed dashboard UI implementation and fixed authentication bugs.",
        loginTime: "09:00 AM",
        logoutTime: "06:00 PM",
        reviewerId: userId,
        remark: "Good progress",
        createdAt: Date.now(),
      },
      {
        employeeId: userId,
        reportDate: Date.now(),
        workSummary:
          "Worked on Convex backend APIs and optimized queries.",
        loginTime: "09:30 AM",
        logoutTime: "06:30 PM",
        reviewerId: userId,
        remark: "Need query review",
        createdAt: Date.now(),
      },
    ];

    for (const report of samples) {
      await ctx.db.insert("dailyReport", report);
    }

    return null;
  },
});