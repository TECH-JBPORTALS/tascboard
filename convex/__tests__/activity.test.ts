import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Task activity", () => {
  let t: TestConvexForDataModel<DataModel>;
  let projectId: Id<"projects">;
  let trackId: Id<"tracks">;
  let taskId: Id<"tasks">;

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
      name: "Test User",
    });

    projectId = await t.mutation(api.project.create, {
      name: "Project A",
      summary: "Test",
      icon: "📁",
      color: "purple",
      startDate: 1,
      endDate: 2,
      status: "active",
    });

    trackId = await t.mutation(api.track.create, {
      name: "Track A",
      description: "Track",
      projectId,
      trackCode: "TR-001",
      trackLeaderID: "emp-1",
      status: "active",
    });

    taskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      taskCode: "TASK-001",
      title: "Initial Task",
      status: "todo",
      assignedTo: "emp-1",
      assignedBy: "manager-1",
      priority: "medium",
      complexity: "easy",
      startDate: 1,
      endDate: 2,
    });
  });

  test("create logs created activity", async () => {
    const activities = await t.query(api.activity.listByTask, { taskId });

    expect(activities.some((a) => a.kind === "created")).toBe(true);
  });

  test("status update logs activity", async () => {
    await t.mutation(api.task.update, {
      taskId,
      body: { status: "in_progress" },
    });

    const activities = await t.query(api.activity.listByTask, { taskId });

    expect(
      activities.some(
        (a) => a.kind === "status_changed" && a.toValue === "In progress",
      ),
    ).toBe(true);
  });
});
