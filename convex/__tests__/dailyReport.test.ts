import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Daily Report", () => {
  let t: TestConvexForDataModel<DataModel>;

  beforeEach(() => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });
  });

  test("seedDailyReports creates sample reports", async () => {
    await t.mutation(api.dailyReport.seedDailyReports);

    const reports = await t.query(api.dailyReport.list);

    expect(reports.length).toBeGreaterThanOrEqual(2);

    expect(reports.some((x) => x.workSummary.includes("dashboard UI"))).toBe(
      true,
    );
  });

  test("seedDailyReports is idempotent", async () => {
    await t.mutation(api.dailyReport.seedDailyReports);

    await t.mutation(api.dailyReport.seedDailyReports);

    const reports = await t.query(api.dailyReport.list);

    expect(reports.length).toBe(2);
  });

  test("create creates a report", async () => {
    const reportId = await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "Worked on backend APIs",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "Completed successfully",
    });

    expect(reportId).toBeDefined();

    const report = await t.query(api.dailyReport.get, {
      reportId,
    });

    expect(report?.workSummary).toBe("Worked on backend APIs");

    expect(report?.remark).toBe("Completed successfully");
  });

  test("list returns all daily reports", async () => {
    await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "Task one",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "Done",
    });

    await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "Task two",
      loginTime: "10:00 AM",
      logoutTime: "07:00 PM",
      reviewerId: "reviewer-1",
      remark: "Completed",
    });

    const reports = await t.query(api.dailyReport.list);

    expect(reports.length).toBe(2);
  });

  test("get returns single report", async () => {
    const reportId = await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "Single report",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "Verified",
    });

    const report = await t.query(api.dailyReport.get, {
      reportId,
    });

    expect(report).not.toBeNull();

    expect(report?.workSummary).toBe("Single report");
  });

  test("update updates daily report", async () => {
    const reportId = await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "Old summary",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "Old remark",
    });

    await t.mutation(api.dailyReport.update, {
      reportId,
      workSummary: "Updated summary",
      remark: "Updated remark",
    });

    const report = await t.query(api.dailyReport.get, {
      reportId,
    });

    expect(report?.workSummary).toBe("Updated summary");

    expect(report?.remark).toBe("Updated remark");
  });

  test("remove removes report", async () => {
    const reportId = await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "Delete report",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "Delete",
    });

    await t.mutation(api.dailyReport.remove, {
      reportId,
    });

    const report = await t.query(api.dailyReport.get, {
      reportId,
    });

    expect(report).toBeNull();
  });
  test("createTaskTag creates task tag", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "ERP Project",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    const trackId = await t.run(async (ctx) => {
      return await ctx.db.insert("tracks", {
        name: "Backend Track",
        projectId,
        trackCode: "TRK-1",
        trackLeaderID: "user-1",
        status: "active",
        createdAt: Date.now(),
      });
    });

    const reportId = await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "API work",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "Done",
    });

    const taskId = await t.run(async (ctx) => {
      return await ctx.db.insert("tasks", {
        trackId,
        projectId,
        title: "Build API",
        status: "todo",
        priority: "high",
        complexity: "medium",
        createdBy: "user-1",
        taskCode: "1",
        dueDate: Date.now(),
        createdAt: Date.now(),
      });
    });

    const tagId = await t.mutation(api.dailyReport.createTaskTag, {
      reportId,
      taskId,
    });

    expect(tagId).toBeDefined();

    const tags = await t.query(api.dailyReport.listTaskTags, {
      reportId,
    });

    expect(tags.length).toBe(1);

    expect(tags[0]?.taskId).toBe(taskId);
  });

  test("updateTaskTag prevents duplicate tag", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "ERP Project",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    const trackId = await t.run(async (ctx) => {
      return await ctx.db.insert("tracks", {
        name: "Backend Track",
        projectId,
        trackCode: "TRK-11",
        trackLeaderID: "user-1",
        status: "active",
        createdAt: Date.now(),
      });
    });

    const reportId = await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "Duplicate test",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "OK",
    });

    const taskId1 = await t.run(async (ctx) => {
      return await ctx.db.insert("tasks", {
        trackId,
        projectId,
        taskCode: "T-3",
        title: "Task 3",
        status: "todo",
        createdBy: "user-1",
        priority: "high",
        complexity: "easy",
        dueDate: Date.now(),
        createdAt: Date.now(),
      });
    });

    const taskId2 = await t.run(async (ctx) => {
      return await ctx.db.insert("tasks", {
        trackId,
        projectId,
        taskCode: "T-4",
        title: "Task 4",
        status: "todo",
        createdBy: "user-1",
        priority: "high",
        complexity: "easy",
        dueDate: Date.now(),
        createdAt: Date.now(),
      });
    });

    await t.mutation(api.dailyReport.createTaskTag, {
      reportId,
      taskId: taskId1,
    });

    const tag2 = await t.mutation(api.dailyReport.createTaskTag, {
      reportId,
      taskId: taskId2,
    });

    expect(tag2).toBeDefined();

    await expect(
      t.mutation(api.dailyReport.updateTaskTag, {
        tagId: tag2,
        taskId: taskId1,
      }),
    ).rejects.toThrow("Task already tagged for this report");
  });

  test("removeTaskTag deletes task tag", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "ERP Project",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    const trackId = await t.run(async (ctx) => {
      return await ctx.db.insert("tracks", {
        name: "Frontend Track",
        projectId,
        trackCode: "TRK-2",
        trackLeaderID: "user-1",
        status: "active",
        createdAt: Date.now(),
      });
    });

    const reportId = await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "UI work",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "Done",
    });

    const taskId = await t.run(async (ctx) => {
      return await ctx.db.insert("tasks", {
        trackId,
        projectId,
        taskCode: "TASK-2",
        title: "Build Dashboard",
        status: "todo",
        createdBy: "user-1",
        priority: "medium",
        complexity: "easy",
        dueDate: Date.now(),
        createdAt: Date.now(),
      });
    });

    const tagId = await t.mutation(api.dailyReport.createTaskTag, {
      reportId,
      taskId,
    });

    await t.mutation(api.dailyReport.removeTaskTag, {
      tagId,
    });

    const tags = await t.query(api.dailyReport.listTaskTags, {
      reportId,
    });

    expect(tags.length).toBe(0);
  });

  test("createTaskTag rejects duplicate task tag", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "ERP Project",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });
    const trackId = await t.run(async (ctx) => {
      return await ctx.db.insert("tracks", {
        name: "Frontend Track",
        projectId,
        trackCode: "TRK-2",
        trackLeaderID: "user-1",
        status: "active",
        createdAt: Date.now(),
      });
    });
    const reportId = await t.mutation(api.dailyReport.create, {
      employeeId: "user-1",
      reportDate: Date.now(),
      workSummary: "UI work",
      loginTime: "09:00 AM",
      logoutTime: "06:00 PM",
      reviewerId: "reviewer-1",
      remark: "Done",
    });

    const taskId = await t.run(async (ctx) => {
      return await ctx.db.insert("tasks", {
        trackId,
        projectId,
        taskCode: "TASK-2",
        title: "Build Dashboard",
        status: "todo",
        createdBy: "user-1",
        priority: "medium",
        complexity: "easy",
        dueDate: Date.now(),
        createdAt: Date.now(),
      });
    });

    await t.mutation(api.dailyReport.createTaskTag, {
      reportId,
      taskId,
    });

    await expect(
      t.mutation(api.dailyReport.createTaskTag, {
        reportId,
        taskId,
      }),
    ).rejects.toThrow("Task already tagged");
  });
});
