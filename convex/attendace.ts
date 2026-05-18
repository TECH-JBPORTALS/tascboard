import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

/** =========================
 * VALIDATORS
 * ========================= */

const attendanceStatusValidator = v.union(
  v.literal("present"),
  v.literal("late"),
  v.literal("half day"),
  v.literal("on leave"),
);

const attendanceReturn = v.object({
  _id: v.id("attendance"),
  _creationTime: v.number(),
  employeeId: v.id("employees"),
  recordDate: v.number(),
  loginTime: v.number(),
  logoutTime: v.optional(v.number()),
  status: attendanceStatusValidator,
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

/** =========================
 * MARK ATTENDANCE (LOGIN)
 * ========================= */

export const markAttendance = mutation({
  args: {
    employeeId: v.id("employees"),
    loginTime: v.number(),
  },

  returns: v.id("attendance"),

  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);

    if (!employee) {
      throw new Error("Employee not found");
    }

    const date = new Date(args.loginTime);
    date.setHours(0, 0, 0, 0);
    const recordDate = date.getTime();

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_employee_and_date", (q) =>
        q
          .eq("employeeId", args.employeeId)
          .eq("recordDate", recordDate),
      )
      .unique();

    if (existing) {
      throw new Error("Attendance already marked for today");
    }

    const login = new Date(args.loginTime);

    let status: Doc<"attendance">["status"] = "present";

    if (
      login.getHours() > 10 ||
      (login.getHours() === 10 && login.getMinutes() > 0)
    ) {
      status = "late";
    }

    return await ctx.db.insert("attendance", {
      employeeId: args.employeeId,
      recordDate,
      loginTime: args.loginTime,
      status,
      createdAt: Date.now(),
    });
  },
});

/** =========================
 * MARK LOGOUT
 * ========================= */

export const markLogout = mutation({
  args: {
    employeeId: v.id("employees"),
    logoutTime: v.number(),
  },

  returns: v.null(),

  handler: async (ctx, args) => {
    const date = new Date(args.logoutTime);
    date.setHours(0, 0, 0, 0);
    const recordDate = date.getTime();

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_employee_and_date", (q) =>
        q
          .eq("employeeId", args.employeeId)
          .eq("recordDate", recordDate),
      )
      .unique();

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    const workedHours =
      (args.logoutTime - attendance.loginTime) / (1000 * 60 * 60);

    const status =
      workedHours < 4 ? "half day" : attendance.status;

    await ctx.db.patch(attendance._id, {
      logoutTime: args.logoutTime,
      status,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/** =========================
 * LIST BY EMPLOYEE
 * ========================= */

export const listByEmployee = query({
  args: {
    employeeId: v.id("employees"),
  },

  returns: v.array(attendanceReturn),

  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_employee", (q) =>
        q.eq("employeeId", args.employeeId),
      )
      .collect();
  },
});

/** =========================
 * FILTER ATTENDANCE
 * ========================= */

export const filter = query({
  args: {
    employeeId: v.optional(v.id("employees")),
    status: v.optional(attendanceStatusValidator),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },

  returns: v.array(attendanceReturn),

  handler: async (ctx, args) => {
    let records: Doc<"attendance">[];

    if (args.employeeId) {
      records = await ctx.db
        .query("attendance")
        .withIndex("by_employee", (q) =>
          q.eq("employeeId", args.employeeId!),
        )
        .collect();
    } else {
      records = await ctx.db.query("attendance").collect();
    }

    if (args.status) {
      records = records.filter((r) => r.status === args.status);
    }

    if (args.startDate) {
      records = records.filter(
        (r) => r.recordDate >= args.startDate!,
      );
    }

    if (args.endDate) {
      records = records.filter(
        (r) => r.recordDate <= args.endDate!,
      );
    }

    return records;
  },
});

/** =========================
 * ATTENDANCE REPORT
 * ========================= */

export const report = query({
  args: {
    employeeId: v.optional(v.id("employees")),
    startDate: v.number(),
    endDate: v.number(),
  },

  returns: v.object({
    summary: v.object({
      totalDays: v.number(),
      present: v.number(),
      late: v.number(),
      onLeave: v.number(),
      halfDay: v.number(),
    }),
    records: v.array(
      v.object({
        date: v.string(),
        status: attendanceStatusValidator,
        loginTime: v.number(),
        logoutTime: v.optional(v.number()),
      }),
    ),
  }),

  handler: async (ctx, args) => {
    let records = await ctx.db.query("attendance").collect();

    if (args.employeeId) {
      records = records.filter(
        (r) => r.employeeId === args.employeeId,
      );
    }

    records = records.filter(
      (r) =>
        r.recordDate >= args.startDate &&
        r.recordDate <= args.endDate,
    );

    let present = 0;
    let late = 0;
    let leave = 0;
    let halfDay = 0;

    const list: Array<{
      date: string;
      status: Doc<"attendance">["status"];
      loginTime: number;
      logoutTime?: number;
    }> = [];

    for (const r of records) {
      if (r.status === "present") present++;
      if (r.status === "late") late++;
      if (r.status === "on leave") leave++;
      if (r.status === "half day") halfDay++;

      list.push({
        date: new Date(r.recordDate)
          .toISOString()
          .split("T")[0],
        status: r.status,
        loginTime: r.loginTime,
        logoutTime: r.logoutTime,
      });
    }

    return {
      summary: {
        totalDays: records.length,
        present,
        late,
        onLeave: leave,
        halfDay,
      },
      records: list,
    };
  },
});