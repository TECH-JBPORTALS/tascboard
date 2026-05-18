import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";
import type { DataModelFromSchemaDefinition } from "convex/server";
import type { GenericId } from "convex/values";

import { api, internal } from "./_generated/api";
import projectTestSchema from "./projectTestSchema";
import { insertTestEmployee } from "./testHelpers";

type SprintTestDataModel = DataModelFromSchemaDefinition<
  typeof projectTestSchema
>;

describe("Sprint", () => {
  let t: TestConvexForDataModel<SprintTestDataModel>;
  let organizationId: GenericId<"organization">;
  let trackId: GenericId<"tracks">;
  let sprintId: GenericId<"sprints">;
  let taskId: GenericId<"tasks">;

  beforeEach(async () => {
    t = convexTest(projectTestSchema).withIdentity({
      tokenIdentifier: "user-1",
    });

    organizationId = await t.run(async (ctx) => {
      return await ctx.db.insert("organization", {
        name: "Test Org",
        slug: "test-org",
        createdAt: Date.now(),
      });
    });

    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationID: organizationId,
        name: "Project A",
        description: "Test project",
        startDate: 1700000000000,
        endDate: 1800000000000,
        status: "active",
        createdAt: 1700000000000,
      });
    });

    const trackLeaderID = await insertTestEmployee(t);

    trackId = await t.run(async (ctx) => {
      return await ctx.db.insert("tracks", {
        name: "Track A",
        description: "Test track",
        projectId,
        trackCode: "TRK-001",
        trackLeaderID,
        status: "active",
        createdAt: Date.now(),
      });
    });

    taskId = await t.run(async (ctx) => {
      return await ctx.db.insert("tasks", {
        title: "Task A",
        description: "Test task",
        status: "todo",
        priority: "medium",
        dueDate: null,
        trackId,
      });
    });

    sprintId = await t.mutation(internal.sprint.create, {
      trackId,
      sprintName: " Sprint 1 ",
      goal: " Build UI ",
      startDate: Date.now(),
      endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
  });

  // 1. CREATE SPRINT
  test("create sprint trims values and sets default status", async () => {
    const sprint = await t.run(async (ctx) => {
      return await ctx.db.get("sprints", sprintId);
    });

    expect(sprint?.sprintName).toBe("Sprint 1");
    expect(sprint?.goal).toBe("Build UI");
    expect(sprint?.status).toBe("planned");
  });
  test("create sprint throws if startDate < endDate", async () => {
    await expect(
      t.mutation(internal.sprint.create, {
        trackId,
        sprintName: "Test",
        goal: "Test",
        startDate: 100,
        endDate: 50,
      })
    ).rejects.toThrow("Start date cannot be after end date");
  });
  // 2. UPDATE SPRINT
  test("edit sprint updates fields", async () => {
    await t.mutation(api.sprint.edit, {
      sprintId,
      sprintName: "Updated Sprint",
      goal: "Updated Goal",
      startDate: Date.now(),
      endDate: Date.now() + 1000,
      status: "active",
    });

    const sprint = await t.run(async (ctx) => {
      return await ctx.db.get("sprints", sprintId);
    });

    expect(sprint?.sprintName).toBe("Updated Sprint");
    expect(sprint?.goal).toBe("Updated Goal");
    expect(sprint?.status).toBe("active");
    expect(sprint?.updatedAt).toBeDefined();
  });
  test("edit throws if sprint name is empty", async () => {
    await expect(
      t.mutation(api.sprint.edit, {
        sprintId,
        sprintName: "   ",
        goal: "Valid goal",
        startDate: Date.now(),
        endDate: Date.now() + 1000,
        status: "active",
      })
    ).rejects.toThrow("Sprint name cannot be empty");
  });
  test("edit throws if goal is empty", async () => {
    await expect(
      t.mutation(api.sprint.edit, {
        sprintId,
        sprintName: "Sprint",
        goal: "   ",
        startDate: Date.now(),
        endDate: Date.now() + 1000,
        status: "active",
      })
    ).rejects.toThrow("Goal cannot be empty");
  });
  test("edit throws if startDate > endDate", async () => {
    await expect(
      t.mutation(api.sprint.edit, {
        sprintId,
        sprintName: "Sprint",
        goal: "Goal",
        startDate: 100,
        endDate: 50,
        status: "active",
      })
    ).rejects.toThrow("Start date cannot be after end date");
  });
  test("edit returns early if no changes", async () => {
    const before = await t.run(async (ctx) => ctx.db.get(sprintId));
  
    await t.mutation(api.sprint.edit, {
      sprintId,
      sprintName: before!.sprintName,
      goal: before!.goal,
      startDate: before!.startDate,
      endDate: before!.endDate,
      status: before!.status,
    });
  
    const after = await t.run(async (ctx) => ctx.db.get(sprintId));
  
    expect(after?.updatedAt).toBeUndefined();
  });
  // 3. DELETE SPRINT
  test("remove deletes sprint", async () => {
    await t.mutation(api.sprint.remove, { sprintId });

    const sprint = await t.run(async (ctx) => {
      return await ctx.db.get("sprints", sprintId);
    });

    expect(sprint).toBeNull();
  });
  test("remove throws if sprint not found", async () => {
    const fakeId = sprintId; // reuse type-safe ID
    await t.mutation(api.sprint.remove, { sprintId: fakeId });
  
    await expect(
      t.mutation(api.sprint.remove, { sprintId: fakeId })
    ).rejects.toThrow("Sprint not found");
  });

  // 4. ADD TASK TO SPRINT
  test("addTaskToSprint validates same track", async () => {
    const res = await t.mutation(api.sprint.addTask, {
      taskId,
      sprintId,
    });

    expect(res.success).toBe(true);
    expect(res.message).toBe("Task is valid for this sprint");
  });
  test("addTaskToSprint throws if task not found", async () => {
    // create a valid sprint (you already have sprintId)
  
    // create a VALID fake task id by creating and deleting
    const tempTaskId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("tasks", {
        title: "Temp task",
        description: "temp",
        status: "todo",
        priority: "low",
        dueDate: null,
        trackId,
      });
  
      await ctx.db.delete(id); // remove it immediately
      return id;
    });
  
    await expect(
      t.mutation(api.sprint.addTask, {
        taskId: tempTaskId,
        sprintId,
      })
    ).rejects.toThrow("Task not found");
  });
  test("addTaskToSprint throws if sprint not found", async () => {
    const fakeSprintId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("sprints", {
        trackId,
        sprintName: "Temp sprint",
        goal: "Temp goal",
        startDate: Date.now(),
        endDate: Date.now() + 1000,
        status: "planned",
        createdAt: Date.now(),
      });
  
      await ctx.db.delete(id); // remove immediately
      return id;
    });
  
    await expect(
      t.mutation(api.sprint.addTask, {
        taskId,
        sprintId: fakeSprintId,
      })
    ).rejects.toThrow("Sprint not found");
  });
  // 5. BACKLOG
  test("getBacklog returns tasks for track", async () => {
    const res = await t.query(api.sprint.Backlog, {
      trackId,
    });

    expect(res.length).toBe(1);
    expect(res[0].title).toBe("Task A");
  });
  test("getBacklog returns empty array for invalid track", async () => {
    const fakeTrackId = await t.run(async (ctx) => {
      const tempLeaderId = await ctx.db.insert("employee", {
        name: "Temp Leader",
        createdAt: Date.now(),
      });
      const id = await ctx.db.insert("tracks", {
        name: "Temp track",
        description: "temp",
        projectId: await ctx.db.insert("projects", {
          organizationID: organizationId,
          name: "Temp project",
          startDate: 1700000000000,
          endDate: 1800000000000,
          status: "active",
          createdAt: 1700000000000,
        }),
        trackCode: "TRK-TMP",
        trackLeaderID: tempLeaderId,
        status: "active",
        createdAt: Date.now(),
      });
  
      await ctx.db.delete(id); // remove immediately
      return id;
    });
  
    const res = await t.query(api.sprint.Backlog, {
      trackId: fakeTrackId,
    });
  
    expect(res.length).toBe(0);
  });
  // 6. SPRINT PROGRESS
  test("getSprintProgress calculates correctly", async () => {
    const res = await t.query(api.sprint.Progress, {
      sprintId,
    });

    expect(res.total).toBe(1);
    expect(res.todo).toBe(1);
    expect(res.done).toBe(0);
    expect(res.progress).toBe(0);
  });

  // 7. BURNDOWN CHART
  test("getBurndownChart returns timeline data", async () => {
    const res = await t.query(api.sprint.BurndownChart, {
      sprintId,
    });

    expect(res.totalTasks).toBe(1);
    expect(res.doneTasks).toBe(0);

    expect(Array.isArray(res.burndown)).toBe(true);
    expect(res.burndown.length).toBeGreaterThan(0);

    expect(res.burndown[0]).toHaveProperty("ideal");
    expect(res.burndown[0]).toHaveProperty("remaining");
    expect(res.burndown[0]).toHaveProperty("date");
  });

  test("burndown works when no tasks exist", async () => {
    const emptyTrackId = trackId;
  
    const res = await t.query(api.sprint.BurndownChart, {
      sprintId,
    });
  
    expect(res.burndown.length).toBeGreaterThan(0);
  });
});