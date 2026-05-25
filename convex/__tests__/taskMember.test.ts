import { beforeEach, describe, expect, test, vi } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";
import { modules } from "./_modules.test";

vi.mock("../lib/getUser", () => ({
  getUserByUserId: async () => ({
    email: "test@email.com",
  }),
}));

describe("TaskMember", () => {
  let t: TestConvexForDataModel<DataModel>;
  let taskId: Id<"tasks">;

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    const projectId = await t.mutation(api.project.create, {
      name: "Test Project",
      summary: "Test project",
      icon: "📁",
      color: "purple",
      startDate: Date.now(),
      endDate: Date.now() + 100000,
      status: "active",
    });

    const trackId = await t.mutation(api.track.create, {
      name: "Test Track",
      description: "Test track",
      projectId,
      trackCode: "TRK-1",
      trackLeaderID: "user-1",
      status: "active",
    });

    taskId = await t.mutation(api.task.create, {
      trackId,
      projectId,
      taskCode: "TASK-1",
      title: "Test Task",
      description: "Test task description",
      status: "todo",
      assignedTo: "user-2",
      assignedBy: "user-1",
      priority: "medium",
      complexity: "easy",
      startDate: Date.now(),
      endDate: Date.now() + 100000,
    });
  });

  // --------------------
  // TOGGLE MEMBER
  // --------------------
  test("toggleMember adds a member if not exists", async () => {
    await t.mutation(api.taskMember.toggleMember, {
      taskId,
      employeeId: "user-2",
    });

    const members = await t.query(api.taskMember.list, {
      taskId,
    });

    expect(members.length).toBe(1);
    expect(members[0]?.employeeId).toBe("user-2");
  });

  test("toggleMember removes member if already exists", async () => {
    await t.mutation(api.taskMember.toggleMember, {
      taskId,
      employeeId: "user-2",
    });

    await t.mutation(api.taskMember.toggleMember, {
      taskId,
      employeeId: "user-2",
    });

    const members = await t.query(api.taskMember.list, {
      taskId,
    });

    expect(members.length).toBe(0);
  });

  // --------------------
  // SET LEAD
  // --------------------
  test("setLead assigns lead role", async () => {
    await t.mutation(api.taskMember.toggleMember, {
      taskId,
      employeeId: "user-2",
    });

    await t.mutation(api.taskMember.setLead, {
      taskId,
      employeeId: "user-2",
    });

    const members = await t.query(api.taskMember.list, {
      taskId,
    });

    expect(members[0]?.employeeId).toBe("user-2");
    expect(members[0]?.lead).toBe(true);
  });

  test("setLead creates member if not exists", async () => {
    await t.mutation(api.taskMember.setLead, {
      taskId,
      employeeId: "user-3",
    });

    const members = await t.query(api.taskMember.list, {
      taskId,
    });

    expect(members.length).toBe(1);
    expect(members[0]?.employeeId).toBe("user-3");
    expect(members[0]?.lead).toBe(true);
  });

  test("setLead enforces single lead per task", async () => {
    await t.mutation(api.taskMember.setLead, {
      taskId,
      employeeId: "user-2",
    });

    await t.mutation(api.taskMember.toggleMember, {
      taskId,
      employeeId: "user-3",
    });

    await t.mutation(api.taskMember.setLead, {
      taskId,
      employeeId: "user-3",
    });

    const members = await t.query(api.taskMember.list, {
      taskId,
    });

    const lead = members.find((m) => m.lead);

    expect(lead?.employeeId).toBe("user-3");
  });

  // --------------------
  // UNSET LEAD
  // --------------------
  test("unsetLead removes lead role but keeps member", async () => {
    await t.mutation(api.taskMember.toggleMember, {
      taskId,
      employeeId: "user-2",
    });

    await t.mutation(api.taskMember.setLead, {
      taskId,
      employeeId: "user-2",
    });

    await t.mutation(api.taskMember.unsetLead, {
      taskId,
      employeeId: "user-2",
    });

    const members = await t.query(api.taskMember.list, {
      taskId,
    });

    expect(members.length).toBe(1);
    expect(members[0]?.lead).toBe(false);
  });

  // --------------------
  // LIST
  // --------------------
  test("list returns enriched employee data structure", async () => {
    await t.run(async (ctx) => {
      await ctx.db.insert("employeeProfiles", {
        employeeId: "user-2",
        onboardingStatus: "completed",
        onboardingStep: 1,
        firstName: "Walter",
        lastName: "White",
      });
    });

    await t.mutation(api.taskMember.toggleMember, {
      taskId,
      employeeId: "user-2",
    });

    const members = await t.query(api.taskMember.list, {
      taskId,
    });

    expect(members.length).toBe(1);

    const member = members[0];
    expect(member).toBeDefined();
    expect(member?.employee).toBeDefined();
    expect(member?.employee.email).toBeDefined();
    expect(typeof member?.employee.name).toBe("string");
    expect(typeof member?.employee.email).toBe("string");
  });
});
