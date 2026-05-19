import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Subtask", () => {
  let t: TestConvexForDataModel<DataModel>;

  let projectId: Id<"projects">;
  let trackId: Id<"tracks">;
  let taskId: Id<"tasks">;
  let subtaskId: Id<"subtasks">;

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    projectId = await t.mutation(api.project.create, {
      name: "Project A",
      summary: "Test Project",
      icon: "📁",
      color: "purple",
      startDate: 1,
      endDate: 2,
      status: "active",
    });

    trackId = await t.mutation(api.track.create, {
      name: "Track A",
      description: "Track Desc",
      projectId,
      trackCode: "TR-001",
      trackLeaderID: "emp-1",
      status: "active",
    });

    taskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      taskCode: "TASK-001",
      title: "Task A",
      description: "Task Desc",
      status: "todo",
      assignedTo: "emp-1",
      assignedBy: "manager-1",
      priority: "high",
      complexity: "medium",
      startDate: 1,
      endDate: 2,
    });

    subtaskId = await t.mutation(api.subtask.create, {
      taskId,
      title: "Initial Subtask",
      deviceName: "Chrome",
    });
  });

  // --------------------
  // CREATE
  // --------------------
  test("create subtask", async () => {
    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks.length).toBe(1);
    expect(subtasks[0]?.title).toBe("Initial Subtask");
    expect(subtasks[0]?.completed).toBe(false);
    expect(subtasks[0]?.order).toBe(0);
  });

  test("create trims title", async () => {
    await t.mutation(api.subtask.create, {
      taskId,
      title: "   Trimmed Title   ",
      deviceName: "Chrome",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks.some((s) => s.title === "Trimmed Title")).toBe(true);
  });

  test("create throws if title is empty", async () => {
    await expect(
      t.mutation(api.subtask.create, {
        taskId,
        title: "   ",
        deviceName: "Chrome",
      }),
    ).rejects.toThrow("Subtask title cannot be empty");
  });

  // --------------------
  // LIST
  // --------------------
  test("listByTask returns subtasks", async () => {
    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks.length).toBe(1);
    expect(subtasks[0]?.title).toBe("Initial Subtask");
  });

  test("listByTask returns empty array when no subtasks exist", async () => {
    const emptyTaskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      taskCode: "TASK-002",
      title: "Empty Task",
      description: "No subtasks",
      status: "todo",
      assignedTo: "emp-1",
      assignedBy: "manager-1",
      priority: "medium",
      complexity: "easy",
      startDate: 1,
      endDate: 2,
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId: emptyTaskId,
    });

    expect(subtasks).toEqual([]);
  });

  // --------------------
  // TOGGLE
  // --------------------
  test("toggle changes completed status", async () => {
    await t.mutation(api.subtask.toggle, {
      subtaskId,
      deviceName: "Chrome",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks[0]?.completed).toBe(true);
  });

  // --------------------
  // RENAME
  // --------------------
  test("rename updates title", async () => {
    await t.mutation(api.subtask.rename, {
      subtaskId,
      title: "Updated Subtask",
      deviceName: "Chrome",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks[0]?.title).toBe("Updated Subtask");
  });

  test("rename trims title", async () => {
    await t.mutation(api.subtask.rename, {
      subtaskId,
      title: "   Trimmed Rename   ",
      deviceName: "Chrome",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks[0]?.title).toBe("Trimmed Rename");
  });

  test("rename throws if title is empty", async () => {
    await expect(
      t.mutation(api.subtask.rename, {
        subtaskId,
        title: "   ",
        deviceName: "Chrome",
      }),
    ).rejects.toThrow("Subtask title cannot be empty");
  });

  // --------------------
  // REMOVE
  // --------------------
  test("remove deletes subtask", async () => {
    await t.mutation(api.subtask.remove, {
      subtaskId,
      deviceName: "Chrome",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks.length).toBe(0);
  });
});
