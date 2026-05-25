import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";

import { modules } from "./_modules.test";
import { registerProsemirrorSyncComponent } from "./registerComponents.test";

import { vi } from "bun:test";

vi.mock("../lib/getUser", () => ({
  getUserByUserId: async () => ({
    email: "test@email.com",
  }),
}));

function createTestClient(identity: { userId: string; orgId: string }) {
  const base = convexTest(schema, modules);
  registerProsemirrorSyncComponent(base);
  return base.withIdentity(identity);
}

describe("ProjectMember", () => {
  let t: TestConvexForDataModel<DataModel>;
  let projectId: Id<"projects">;

  beforeEach(async () => {
    t = createTestClient({
      userId: "user-1",
      orgId: "org-1",
    });

    projectId = await t.mutation(api.project.create, {
      name: "Test Project",
      summary: "Test project",
      icon: "📁",
      color: "purple",
      startDate: Date.now(),
      endDate: Date.now() + 100000,
      status: "active",
    });
  });
  // --------------------
  // TOGGLE MEMBER
  // --------------------
  test("toggleMember adds a member if not exists", async () => {
    await t.mutation(api.projectMember.toggleMember, {
      employeeId: "user-2",
      projectId,
    });

    const members = await t.query(api.projectMember.list, {
      projectId,
    });

    expect(members.length).toBe(1);
    expect(members[0]?.employeeId).toBe("user-2");
  });

  test("toggleMember removes member if already exists", async () => {
    await t.mutation(api.projectMember.toggleMember, {
      employeeId: "user-2",
      projectId,
    });

    await t.mutation(api.projectMember.toggleMember, {
      employeeId: "user-2",
      projectId,
    });

    const members = await t.query(api.projectMember.list, {
      projectId,
    });

    expect(members.length).toBe(0);
  });

  // --------------------
  // SET MANAGER
  // --------------------
  test("setManager assigns manager role", async () => {
    await t.mutation(api.projectMember.toggleMember, {
      employeeId: "user-2",
      projectId,
    });

    await t.mutation(api.projectMember.setManager, {
      employeeId: "user-2",
      projectId,
    });

    const members = await t.query(api.projectMember.list, {
      projectId,
    });

    expect(members[0]?.employeeId).toBe("user-2");
  });

  test("setManager creates member if not exists", async () => {
    await t.mutation(api.projectMember.setManager, {
      employeeId: "user-3",
      projectId,
    });

    const members = await t.query(api.projectMember.list, {
      projectId,
    });

    expect(members.length).toBe(1);
    expect(members[0]?.employeeId).toBe("user-3");
  });

  test("setManager enforces single manager per project", async () => {
    await t.mutation(api.projectMember.setManager, {
      employeeId: "user-2",
      projectId,
    });

    await expect(
      t.mutation(api.projectMember.setManager, {
        employeeId: "user-3",
        projectId,
      }),
    ).rejects.toThrow("Project already has a manager");
  });

  // --------------------
  // REMOVE MANAGER
  // --------------------
  test("removeManager removes manager role but keeps member", async () => {
    await t.mutation(api.projectMember.setManager, {
      employeeId: "user-2",
      projectId,
    });

    await t.mutation(api.projectMember.removeManager, {
      employeeId: "user-2",
      projectId,
    });

    const members = await t.query(api.projectMember.list, {
      projectId,
    });

    expect(members.length).toBe(1);
    expect(members[0]?.employeeId).toBe("user-2");
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
    await t.mutation(api.projectMember.toggleMember, {
      employeeId: "user-2",
      projectId,
    });

    const members = await t.query(api.projectMember.list, {
      projectId,
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
