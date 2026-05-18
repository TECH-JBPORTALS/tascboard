import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";
import type { DataModelFromSchemaDefinition } from "convex/server";
import type { GenericId } from "convex/values";

import { api } from "./_generated/api";
import projectTestSchema from "./projectTestSchema";
import { insertTestEmployee } from "./testHelpers";

type SubtaskTestDataModel = DataModelFromSchemaDefinition<
  typeof projectTestSchema
>;

describe("Subtask", () => {
  let t: TestConvexForDataModel<SubtaskTestDataModel>;

  let projectId: GenericId<"projects">;
  let trackId: GenericId<"tracks">;
  let taskId: GenericId<"tasks">;
  let subtaskId: GenericId<"subtasks">;

  beforeEach(async () => {
    t = convexTest(projectTestSchema).withIdentity({
      tokenIdentifier: "user-1",
    });

    const organizationId = await t.run(async (ctx) => {
      return await ctx.db.insert("organization", {
        name: "Test Org",
        slug: "test-org",
        createdAt: Date.now(),
      });
    });

    // Create project
    projectId = await t.mutation(api.project.create, {
      organizationID: organizationId,
      name: "Project A",
      description: "Test project",
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: "active",
    });

    const trackLeaderID = await insertTestEmployee(t);

    // Create track
    trackId = await t.mutation(api.track.create, {
      name: "Track A",
      description: "Test track",
      projectId,
      trackCode: "TRK-001",
      trackLeaderID,
      status: "active",
    });

    // Create task
    taskId = await t.mutation(api.task.create, {
      title: "Task A",
      description: "Task description",
      status: "todo",
      priority: "medium",
      dueDate: null,
      trackId,
      deviceName: "MacBook",
    });

    // Create subtask
    subtaskId = await t.mutation(api.subtask.create, {
      taskId,
      title: "Subtask A",
      deviceName: "MacBook",
    });
  });

  // 1. CREATE SUBTASK
  test("create subtask", async () => {
    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks.length).toBe(1);
    expect(subtasks[0].title).toBe("Subtask A");
    expect(subtasks[0].completed).toBe(false);
    expect(subtasks[0].order).toBe(0);
  });

  // 2. LIST SUBTASKS
  test("listByTask returns subtasks for task", async () => {
    await t.mutation(api.subtask.create, {
      taskId,
      title: "Subtask B",
      deviceName: "MacBook",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks.length).toBe(2);
    expect(subtasks[0].title).toBe("Subtask A");
    expect(subtasks[1].title).toBe("Subtask B");
  });

  // 3. TOGGLE SUBTASK
  test("toggle changes completed status", async () => {
    await t.mutation(api.subtask.toggle, {
      subtaskId,
      deviceName: "MacBook",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks[0].completed).toBe(true);
  });

  // 4. TOGGLE AGAIN
  test("toggle twice restores original status", async () => {
    await t.mutation(api.subtask.toggle, {
      subtaskId,
      deviceName: "MacBook",
    });

    await t.mutation(api.subtask.toggle, {
      subtaskId,
      deviceName: "MacBook",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks[0].completed).toBe(false);
  });

  // 5. RENAME SUBTASK
  test("rename updates title", async () => {
    await t.mutation(api.subtask.rename, {
      subtaskId,
      title: "Updated Subtask",
      deviceName: "MacBook",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks[0].title).toBe("Updated Subtask");
  });

  // 6. RENAME WITH SAME TITLE
  test("rename with same title does nothing", async () => {
    await t.mutation(api.subtask.rename, {
      subtaskId,
      title: "Subtask A",
      deviceName: "MacBook",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks[0].title).toBe("Subtask A");
  });

  // 7. REMOVE SUBTASK
  test("remove deletes subtask", async () => {
    await t.mutation(api.subtask.remove, {
      subtaskId,
      deviceName: "MacBook",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks.length).toBe(0);
  });

  // 8. REMOVE NON EXISTING SUBTASK
  test("remove non existing subtask does nothing", async () => {
    await t.mutation(api.subtask.remove, {
      subtaskId,
      deviceName: "MacBook",
    });

    await expect(
      t.mutation(api.subtask.remove, {
        subtaskId,
        deviceName: "MacBook",
      }),
    ).resolves.not.toThrow();
  });

  // 9. TOGGLE NON EXISTING SUBTASK
  test("toggle throws if subtask not found", async () => {
    await t.mutation(api.subtask.remove, {
      subtaskId,
      deviceName: "MacBook",
    });

    await expect(
      t.mutation(api.subtask.toggle, {
        subtaskId,
        deviceName: "MacBook",
      }),
    ).rejects.toThrow("Subtask not found");
  });

  // 10. RENAME NON EXISTING SUBTASK
  test("rename throws if subtask not found", async () => {
    await t.mutation(api.subtask.remove, {
      subtaskId,
      deviceName: "MacBook",
    });

    await expect(
      t.mutation(api.subtask.rename, {
        subtaskId,
        title: "Updated",
        deviceName: "MacBook",
      }),
    ).rejects.toThrow("Subtask not found");
  });

  // 11. ORDER INCREMENTS CORRECTLY
  test("new subtasks increment order correctly", async () => {
    await t.mutation(api.subtask.create, {
      taskId,
      title: "Subtask B",
      deviceName: "MacBook",
    });

    await t.mutation(api.subtask.create, {
      taskId,
      title: "Subtask C",
      deviceName: "MacBook",
    });

    const subtasks = await t.query(api.subtask.listByTask, {
      taskId,
    });

    expect(subtasks[0].order).toBe(0);
    expect(subtasks[1].order).toBe(1);
    expect(subtasks[2].order).toBe(2);
  });
});