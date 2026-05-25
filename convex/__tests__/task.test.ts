import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";

import { modules } from "./_modules.test";

describe("Task", () => {
  let t: TestConvexForDataModel<DataModel>;

  let projectId: Id<"projects">;
  let trackId: Id<"tracks">;
  let taskId: Id<"tasks">;

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    // --------------------
    // CREATE PROJECT
    // --------------------
    projectId = await t.mutation(api.project.create, {
      name: "Project A",
      summary: "Test project",
      icon: "📁",
      color: "purple",
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: "active",
    });

    // --------------------
    // CREATE TRACK
    // --------------------
    trackId = await t.mutation(api.track.create, {
      name: "Track A",
      description: "Test track",
      projectId,
      trackCode: "TR-001",
      trackLeaderID: "emp-1",
      status: "active",
    });

    // --------------------
    // CREATE TASK
    // --------------------
    taskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      taskCode: "TASK-001",
      title: "Initial Task",
      description: "Task description",
      status: "todo",
      assignedTo: "emp-1",
      assignedBy: "manager-1",
      priority: "medium",
      complexity: "easy",
      startDate: 1700000000000,
      endDate: 1800000000000,
    });

    await t.mutation(api.trackMember.toggleMember, {
      trackId,
      employeeId: "emp-1",
    });

    await t.mutation(api.trackMember.toggleMember, {
      trackId,
      employeeId: "emp-2",
    });
  });

  // --------------------
  // CREATE
  // --------------------
  test("create task", async () => {
    const task = await t.query(api.task.get, {
      taskId,
    });

    expect(task).not.toBeNull();

    expect(task?.title).toBe("Initial Task");
    expect(task?.status).toBe("todo");
    expect(task?.priority).toBe("medium");
  });
  test("prevents duplicate task activity spam for same user same day", async () => {
    await t.mutation(api.task.update, {
      taskId,
      body: {
        status: "in_progress",
      },
    });

    await t.mutation(api.task.update, {
      taskId,
      body: {
        status: "in_progress",
      },
    });

    const activities = await t
      .query(api.activity.listByTask, { taskId })
      .catch(() => []);

    const statusActivities = activities.filter(
      (a: any) => a.kind === "status_changed",
    );

    expect(statusActivities.length).toBe(1);
  });
  // --------------------
  // GET
  // --------------------
  test("get returns task by id", async () => {
    const task = await t.query(api.task.get, {
      taskId,
    });

    expect(task?._id).toBe(taskId);
    expect(task?.title).toBe("Initial Task");
  });

  test("get returns null if task not found", async () => {
    await t.mutation(api.task.remove, {
      taskId,
    });

    const result = await t.query(api.task.get, {
      taskId,
    });

    expect(result).toBeNull();
  });

  test("get returns task members", async () => {
    const task = await t.query(api.task.get, {
      taskId,
    });

    expect(task?.members.length).toBe(2);

    expect(task?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: "emp-1",
        }),
        expect.objectContaining({
          employeeId: "emp-2",
        }),
      ]),
    );
  });
  test("list returns tasks", async () => {
    const tasks = await t.query(api.task.list, {});

    expect(tasks.length).toBeGreaterThan(0);

    expect(tasks[0]?.title).toBe("Initial Task");
  });

  test("list returns empty array if there are no tasks", async () => {
    const isolated = convexTest(schema, modules).withIdentity({
      userId: "user-2",
      orgId: "org-2",
    });

    const tasks = await isolated.query(api.task.list, {});

    expect(tasks).toEqual([]);
  });
  // --------------------
  // UPDATE
  // --------------------
  test("update task status to backlog", async () => {
    await t.mutation(api.task.update, {
      taskId,
      body: { status: "backlog" },
    });

    const task = await t.query(api.task.get, { taskId });
    expect(task?.status).toBe("backlog");
  });

  test("update task fields", async () => {
    await t.mutation(api.task.update, {
      taskId,
      body: {
        title: "Updated Task",
        description: "Updated description",
        status: "done",
        priority: "high",
        complexity: "hard",
      },
    });

    const updated = await t.query(api.task.get, {
      taskId,
    });

    expect(updated?.title).toBe("Updated Task");
    expect(updated?.description).toBe("Updated description");
    expect(updated?.status).toBe("done");
    expect(updated?.priority).toBe("high");
    expect(updated?.complexity).toBe("hard");
    expect(updated?.updatedAt).toBeTypeOf("number");
  });

  test("update throws if task title is empty", async () => {
    await expect(
      t.mutation(api.task.update, {
        taskId,
        body: {
          title: "   ",
        },
      }),
    ).rejects.toThrow("Task title cannot be empty");
  });

  test("update throws if task not found", async () => {
    await t.mutation(api.task.remove, {
      taskId,
    });

    await expect(
      t.mutation(api.task.update, {
        taskId,
        body: {
          title: "Updated",
        },
      }),
    ).rejects.toThrow("Task not found");
  });

  // --------------------
  // REMOVE
  // --------------------
  test("remove deletes task", async () => {
    await t.mutation(api.task.remove, {
      taskId,
    });

    const deleted = await t.query(api.task.get, {
      taskId,
    });

    expect(deleted).toBeNull();
  });

  test("remove throws if task not found", async () => {
    await t.mutation(api.task.remove, {
      taskId,
    });

    await expect(
      t.mutation(api.task.remove, {
        taskId,
      }),
    ).rejects.toThrow("Task not found");
  });

  // --------------------
  // TRIMMING
  // --------------------
  test("create trims task title", async () => {
    const newTaskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      taskCode: "TASK-002",
      title: "   Trimmed Task   ",
      description: "Test",
      status: "todo",
      assignedTo: "emp-2",
      assignedBy: "manager-1",
      priority: "low",
      complexity: "easy",
      startDate: 1,
      endDate: 2,
    });

    const task = await t.query(api.task.get, {
      taskId: newTaskId,
    });

    expect(task?.title).toBe("Trimmed Task");
  });
});
