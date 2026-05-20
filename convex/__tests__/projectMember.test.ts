import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Project Member", () => {
  let t: TestConvexForDataModel<DataModel>;

  beforeEach(() => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
    });
  });

  test("add project member", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    const memberId = await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-1",
      manager: false,
    });

    expect(memberId).toBeDefined();

    const projects = await t.query(api.projectMember.list, {});
    expect(projects.length).toBe(1);
  });

  test("prevents duplicate member", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-1",
      manager: false,
    });

    await expect(
      t.mutation(api.projectMember.add, {
        projectId,
        employeeId: "user-1",
        manager: false,
      }),
    ).rejects.toThrow("Employee is already a member of this project");
  });

  test("only one manager per project", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-1",
      manager: true,
    });

    await expect(
      t.mutation(api.projectMember.add, {
        projectId,
        employeeId: "user-2",
        manager: true,
      }),
    ).rejects.toThrow("Project already has a manager");
  });

  test("remove project member", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    const memberId = await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-1",
      manager: false,
    });

    await t.mutation(api.projectMember.remove, {
      memberId,
    });

    const projects = await t.query(api.projectMember.list, {});
    expect(projects.length).toBe(0);
  });

  test("get project only for member", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-1",
      manager: false,
    });

    const project = await t.query(api.projectMember.get, {
      projectId,
    });

    expect(project?._id).toBe(projectId);
  });

  test("reject non-member access", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    await expect(
      t.query(api.projectMember.get, {
        projectId,
      }),
    ).rejects.toThrow("Not authorized to view this project");
  });

  test("list returns only projects where user is a member", async () => {
    const project1 = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project A",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });
  
    const project2 = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project B",
        summary: "Test project B",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });
  
    // only add user to project1
    await t.mutation(api.projectMember.add, {
      projectId: project1,
      employeeId: "user-1",
      manager: false,
    });
  
    const projects = await t.query(api.projectMember.list, {});
  
    expect(projects.length).toBe(1);
    expect(projects[0]?._id).toBe(project1);
  });
  test("update prevents second manager assignment", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });
  
    const member1 = await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-1",
      manager: true,
    });
  
    await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-2",
      manager: false,
    });
  
    const member2 = await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-3",
      manager: false,
    });
  
    await expect(
      t.mutation(api.projectMember.update, {
        memberId: member2,
        manager: true,
      }),
    ).rejects.toThrow("Project already has a manager");
  });

  test("update without manager change keeps existing state", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "Project A",
        summary: "Test project",
        description: "Desc",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });
  
    const memberId = await t.mutation(api.projectMember.add, {
      projectId,
      employeeId: "user-1",
      manager: false,
    });
  
    await t.mutation(api.projectMember.update, {
      memberId,
    });
  
    const project = await t.query(api.projectMember.get, {
      projectId,
    });
  
    expect(project?._id).toBe(projectId);
  });
});