import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

const attendanceStatusValidator = v.union(
  v.literal("present"),
  v.literal("on leave"),
  v.literal("late"),
  v.literal("half day"),
);

const attendanceReturn = v.object({
  _id: v.id("attendance"),
  _creationTime: v.number(),
  employeeId: v.string(),
  recordDate: v.number(),
  loginTime: v.number(),
  logoutTime: v.optional(v.number()),
  status: attendanceStatusValidator,
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const createAttendance = mutation({
  args: {
    employeeId: v.string(),
    recordDate: v.number(),
    loginTime: v.number(),
    logoutTime: v.optional(v.number()),
    status: attendanceStatusValidator,
  },

  returns: v.id("attendance"),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_employee_and_date", (q) =>
        q
          .eq("employeeId", args.employeeId)
          .eq("recordDate", args.recordDate),
      )
      .first();

    if (existingAttendance) {
      throw new Error(
        "Attendance already exists for this date",
      );
    }

    return await ctx.db.insert("attendance", {
      employeeId: args.employeeId,
      recordDate: args.recordDate,
      loginTime: args.loginTime,
      logoutTime: args.logoutTime,
      status: args.status,
      createdAt: Date.now(),
    });
  },
});

export const listByEmployee = query({
  args: {
    employeeId: v.string(),
  },

  returns: v.array(attendanceReturn),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    return await ctx.db
      .query("attendance")
      .withIndex("by_employee", (q) =>
        q.eq("employeeId", args.employeeId),
      )
      .order("desc")
      .collect();
  },
});

export const getAttendanceByDate = query({
  args: {
    employeeId: v.string(),
    recordDate: v.number(),
  },

  returns: v.union(attendanceReturn, v.null()),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    return await ctx.db
      .query("attendance")
      .withIndex("by_employee_and_date", (q) =>
        q
          .eq("employeeId", args.employeeId)
          .eq("recordDate", args.recordDate),
      )
      .first();
  },
});

export const updateAttendance = mutation({
  args: {
    attendanceId: v.id("attendance"),
    loginTime: v.optional(v.number()),
    logoutTime: v.optional(v.number()),
    status: v.optional(attendanceStatusValidator),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const attendance = await ctx.db.get(
      args.attendanceId,
    );

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    await ctx.db.patch(args.attendanceId, {
      ...(args.loginTime !== undefined && {
        loginTime: args.loginTime,
      }),

      ...(args.logoutTime !== undefined && {
        logoutTime: args.logoutTime,
      }),

      ...(args.status !== undefined && {
        status: args.status,
      }),

      updatedAt: Date.now(),
    });

    return null;
  },
});

export const deleteAttendance = mutation({
  args: {
    attendanceId: v.id("attendance"),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const attendance = await ctx.db.get(
      args.attendanceId,
    );

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    await ctx.db.delete(args.attendanceId);

    return null;
  },
});

export const markLogout = mutation({
  args: {
    attendanceId: v.id("attendance"),
    logoutTime: v.number(),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const attendance = await ctx.db.get(
      args.attendanceId,
    );

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    await ctx.db.patch(args.attendanceId, {
      logoutTime: args.logoutTime,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const listTodayAttendance = query({
  args: {
    startOfDay: v.number(),
    endOfDay: v.number(),
  },

  returns: v.array(attendanceReturn),

  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    return await ctx.db
      .query("attendance")
      .filter((q) =>
        q.and(
          q.gte(q.field("recordDate"), args.startOfDay),
          q.lte(q.field("recordDate"), args.endOfDay),
        ),
      )
      .collect();
  },
});