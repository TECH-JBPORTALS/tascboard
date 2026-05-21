import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Sprint", () => {
  let t: TestConvexForDataModel<DataModel>;
  let trackId: Id<"tracks">;
  let sprintId: Id<"sprints">;
  let taskId: Id<"tasks">;

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    // create project
    const projectId = await t.mutation(api.project.create, {
      name: "Project A",
      summary: "Test Project",
      icon: "📁",
      color: "purple",
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: "active",
    });

    // create track
    trackId = await t.mutation(api.track.create, {
      name: "Track A",
      description: "Track desc",
      projectId,
      trackCode: "TR-001",
      trackLeaderID: "emp-1",
      status: "active",
    });

    // create task (needed for backlog/progress/burndown)
    taskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      taskCode: "T-001",
      title: "Task 1",
      description: "Test task",
      status: "todo",
      assignedTo: "emp-1",
      assignedBy: "emp-1",
      priority: "medium",
      complexity: "easy",
      startDate: Date.now(),
      endDate: Date.now() + 100000,
    });

    // create sprint
    sprintId = await t.mutation(api.sprint.create, {
      trackId,
      sprintName: "Sprint 1",
      goal: "Build feature",
      startDate: Date.now(),
      endDate: Date.now() + 100000,
    });
  });

  // --------------------
  // CREATE
  // --------------------
  test("create sprint sets createdBy automatically", async () => {
    const sprint = await t.query(api.sprint.listByTrack, {
      trackId,
    });

    expect(sprint.length).toBe(1);
    expect(sprint[0]?.sprintName).toBe("Sprint 1");
    expect(sprint[0]?.goal).toBe("Build feature");
    expect(sprint[0]?.createdBy).toBe("user-1");
  });

  // --------------------
  // EDIT
  // --------------------
  test("edit sprint updates fields", async () => {
    await t.mutation(api.sprint.edit, {
      sprintId,
      sprintName: "Updated Sprint",
      goal: "Updated Goal",
      startDate: Date.now(),
      endDate: Date.now() + 200000,
      status: "active",
    });

    const sprint = await t.query(api.sprint.listByTrack, {
      trackId,
    });

    expect(sprint[0]?.sprintName).toBe("Updated Sprint");
    expect(sprint[0]?.status).toBe("active");
  });

  // --------------------
  // REMOVE
  // --------------------
  test("remove sprint deletes sprint", async () => {
    await t.mutation(api.sprint.remove, {
      sprintId,
    });

    const sprint = await t.query(api.sprint.listByTrack, {
      trackId,
    });

    expect(sprint.length).toBe(0);
  });

  // --------------------
  // ADD TASK
  // --------------------
  test("addTask validates same track", async () => {
    const res = await t.mutation(api.sprint.addTask, {
      taskId,
      sprintId,
    });

    expect(res.success).toBe(true);
    expect(res.message).toBe("Task added to sprint");

    const backlog = await t.query(api.sprint.backlog, { trackId });
    expect(backlog.length).toBe(0);

    const sprintTasks = await t.query(api.sprint.listTasksBySprint, {
      sprintId,
    });
    expect(sprintTasks.length).toBe(1);
    expect(sprintTasks[0]?._id).toBe(taskId);
  });

  // --------------------
  // BACKLOG
  // --------------------
  test("backlog returns tasks for track", async () => {
    const tasks = await t.query(api.sprint.backlog, {
      trackId,
    });

    expect(tasks.length).toBe(1);
    expect(tasks[0]?._id).toBe(taskId);
  });

  // --------------------
  // PROGRESS
  // --------------------
  test("progress calculates sprint stats", async () => {
    await t.mutation(api.sprint.addTask, { taskId, sprintId });

    const progress = await t.query(api.sprint.progress, {
      sprintId,
    });

    expect(progress.total).toBe(1);
    expect(progress.todo).toBe(1);
    expect(progress.done).toBe(0);
    expect(progress.inProgress).toBe(0);
    expect(progress.progress).toBe(0);
  });

  // --------------------
  // BURNDOWN
  // --------------------
  test("burndownChart returns data", async () => {
    await t.mutation(api.sprint.addTask, { taskId, sprintId });

    const result = await t.query(api.sprint.burndownChart, {
      sprintId,
    });

    expect(result.sprintId).toBe(sprintId);
    expect(result.totalTasks).toBe(1);
    expect(result.doneTasks).toBe(0);
    expect(Array.isArray(result.burndown)).toBe(true);
    expect(result.burndown.length).toBeGreaterThan(0);
  });

  // --------------------
  // EDGE CASE
  // --------------------
  test("edit throws if sprint not found", async () => {
    // create a real sprint first
    const tempSprintId = await t.mutation(api.sprint.create, {
      trackId,
      sprintName: "Temp Sprint",
      goal: "Temp Goal",
      startDate: Date.now(),
      endDate: Date.now() + 10000,
    });

    // delete it
    await t.mutation(api.sprint.remove, {
      sprintId: tempSprintId,
    });

    // now it should truly not exist
    await expect(
      t.mutation(api.sprint.edit, {
        sprintId: tempSprintId,
        sprintName: "X",
        goal: "Y",
        startDate: 1,
        endDate: 2,
        status: "planned",
      }),
    ).rejects.toThrow("Sprint not found");
  });
});
