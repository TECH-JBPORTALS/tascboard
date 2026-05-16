import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";
import { DataModel, Id } from "./_generated/dataModel";

describe("Task", () => {
  let t: TestConvexForDataModel<DataModel>;
  let projectId: Id<"projects">;
  let trackId: Id<"tracks">;
  let taskId: Id<"tasks">;

  beforeEach(async () => {
    t = convexTest(schema).withIdentity({
      tokenIdentifier: "user-1",
    });

    // Create project
    projectId = await t.mutation(api.project.create, {
      name: "Project A",
      description: "Test project",
    });

    // Create track
    trackId = await t.mutation(api.track.create, {
      name: "Track A",
      description: "Test track",
      projectId,
    });

    // Create task
    taskId = await t.mutation(api.task.create, {
      title: "Task A",
      description: "Test task",
      status: "todo",
      priority: "medium",
      dueDate: null,
      trackId,
      deviceName: "MacBook",
    });
  });

  // 1. CREATE TASK
  test("create task", async () => {
    const task = await t.query(api.task.get, {
      taskId,
    });

    expect(task).not.toBeNull();
    expect(task?.title).toBe("Task A");
    expect(task?.status).toBe("todo");
    expect(task?.priority).toBe("medium");
  });

  // 2. GET TASK
  test("get returns task with track and project", async () => {
    const task = await t.query(api.task.get, {
      taskId,
    });

    expect(task?._id).toBe(taskId);
    expect(task?.track?.name).toBe("Track A");
    expect(task?.project?.name).toBe("Project A");
  });

  // 3. GET ALL TASKS BY TRACK
  test("getAllByTrack returns all tasks", async () => {
    const tasks = await t.query(api.task.getAllByTrack, {
      trackId,
    });

    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe("Task A");
  });

  // 4. UPDATE TASK TITLE
  test("update task title", async () => {
    await t.mutation(api.task.update, {
      taskId,
      deviceName: "MacBook",
      body: {
        title: "Updated Task",
      },
    });

    const updated = await t.query(api.task.get, {
      taskId,
    });

    expect(updated?.title).toBe("Updated Task");
  });

  // 5. UPDATE TASK STATUS
  test("update task status", async () => {
    await t.mutation(api.task.update, {
      taskId,
      deviceName: "MacBook",
      body: {
        status: "done",
      },
    });

    const updated = await t.query(api.task.get, {
      taskId,
    });

    expect(updated?.status).toBe("done");
  });

  // 6. UPDATE TASK PRIORITY
  test("update task priority", async () => {
    await t.mutation(api.task.update, {
      taskId,
      deviceName: "MacBook",
      body: {
        priority: "high",
      },
    });

    const updated = await t.query(api.task.get, {
      taskId,
    });

    expect(updated?.priority).toBe("high");
  });

  // 7. UPDATE TASK DUE DATE
  test("update task due date", async () => {
    const dueDate = Date.now();

    await t.mutation(api.task.update, {
      taskId,
      deviceName: "MacBook",
      body: {
        dueDate,
      },
    });

    const updated = await t.query(api.task.get, {
      taskId,
    });

    expect(updated?.dueDate).toBe(dueDate);
  });

  // 8. UPDATE NON EXISTING TASK
  test("update throws if task does not exist", async () => {
    await t.mutation(api.task.remove, {
      taskId,
    });

    await expect(
      t.mutation(api.task.update, {
        taskId,
        deviceName: "MacBook",
        body: {
          title: "Updated",
        },
      }),
    ).rejects.toThrow("Task not found");
  });

  // 9. DELETE TASK
  test("remove deletes task", async () => {
    await t.mutation(api.task.remove, {
      taskId,
    });

    const deleted = await t.query(api.task.get, {
      taskId,
    });

    expect(deleted).toBeNull();
  });

  // 10. GET RETURNS NULL AFTER DELETE
  test("get returns null after deletion", async () => {
    await t.mutation(api.task.remove, {
      taskId,
    });

    const deleted = await t.query(api.task.get, {
      taskId,
    });

    expect(deleted).toBeNull();
  });

  // 11. ACTIVITY IS CREATED WHEN TASK IS CREATED
  test("create logs activity", async () => {
    const activities = await t.run(async (ctx) => {
      return await ctx.db
        .query("activities")
        .withIndex("by_task", (q) => q.eq("taskId", taskId))
        .collect();
    });

    expect(activities.length).toBe(1);
    expect(activities[0].kind).toBe("created");
  });

  // 12. TITLE CHANGE CREATES ACTIVITY
  test("update title logs activity", async () => {
    await t.mutation(api.task.update, {
      taskId,
      deviceName: "MacBook",
      body: {
        title: "New Title",
      },
    });

    const activities = await t.run(async (ctx) => {
      return await ctx.db
        .query("activities")
        .withIndex("by_task", (q) => q.eq("taskId", taskId))
        .collect();
    });

    expect(
      activities.some((a) => a.kind === "title_changed"),
    ).toBe(true);
  });

  // 13. STATUS CHANGE CREATES ACTIVITY
  test("update status logs activity", async () => {
    await t.mutation(api.task.update, {
      taskId,
      deviceName: "MacBook",
      body: {
        status: "done",
      },
    });

    const activities = await t.run(async (ctx) => {
      return await ctx.db
        .query("activities")
        .withIndex("by_task", (q) => q.eq("taskId", taskId))
        .collect();
    });

    expect(
      activities.some((a) => a.kind === "status_changed"),
    ).toBe(true);
  });
});