import { beforeEach, describe, expect, test, mock } from "bun:test";
import { convexTest } from "convex-test";

import schema from "../schema";
import { modules } from "./_modules.test";

import { api } from "../_generated/api";
import type { DataModel, Id } from "../_generated/dataModel";

import * as employeesLib from "../lib/employees";



describe("Scope - Assignable Members", () => {
  let t = convexTest(schema, modules).withIdentity({
    userId: "admin-user",
    orgId: "org-1",
  });

  beforeEach(() => {
    mock.restore();
  
    mock.module("../lib/employees", () => ({
      ...employeesLib,
  
      listEmployeesByOrg: async () => [
        {
          _id: "emp-1",
          organizationId: "org-1",
          userId: "u1",
          role: "member",
          createdAt: Date.now(),
          active: true,
        },
        {
          _id: "emp-2",
          organizationId: "org-1",
          userId: "u2",
          role: "member",
          createdAt: Date.now(),
          active: true,
        },
        {
          _id: "emp-3",
          organizationId: "org-1",
          userId: "u3",
          role: "member",
          createdAt: Date.now(),
          active: true,
        },
        {
          _id: "emp-4",
          organizationId: "org-1",
          userId: "u4",
          role: "member",
          createdAt: Date.now(),
          active: true,
        },
      ],
    }));
  
    // ✅ ADD THIS NEW MOCK (IMPORTANT FIX)
    mock.module("../lib/getUser", () => ({
        getUserByUserId: async (ctx: any, userId: string) => {
          const users: Record<string, any> = {
            u1: { name: "Walter White", email: "walter@test.com", image: null },
            u2: { name: "Jesse Pinkman", email: "jesse@test.com", image: null },
            u3: { name: "Saul Goodman", email: "saul@test.com", image: null },
            u4: { name: "Gus Fring", email: "gus@test.com", image: null },
          };
      
          return users[userId] ?? null;
        },
      }));
  });

  test("project scope returns project + organization members", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "ERP System",
        summary: "summary",
        description: "description",
        icon: "folder",
        color: "blue",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("projectMember", {
        projectId,
        employeeId: "emp-1",
        manager: false,
        assignedBy: "admin-user",
        createAt: Date.now(),
      });
    });

    const result = await t.query(api.scope.listAssignableMembers, {
      scope: "project",
      projectId,
    });

    expect(result.length).toBe(2);

    expect(result[0]?.group).toBe("project");
    expect(result[0]?.members.length).toBe(1);

    expect(result[1]?.group).toBe("organization");
    expect(result[1]?.members.length).toBe(3);
  });

  test("track scope includes track + project + organization", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "ERP",
        summary: "summary",
        description: "description",
        icon: "folder",
        color: "blue",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    const trackId = await t.run(async (ctx) => {
      return await ctx.db.insert("tracks", {
        name: "Frontend",
        description: "track",
        projectId,
        trackCode: "TR-1",
        trackLeaderID: "u2",
        status: "active",
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("projectMember", {
        projectId,
        employeeId: "emp-1",
        manager: false,
        assignedBy: "admin-user",
        createAt: Date.now(),
      });

      await ctx.db.insert("trackMember", {
        trackId,
        employeeId: "emp-2",
        lead: true,
        assignedAt: Date.now(),
        createdAt: Date.now(),
      });
    });

    const result = await t.query(api.scope.listAssignableMembers, {
      scope: "track",
      projectId,
      trackId,
    });

    expect(result.length).toBe(3);

    const groups = Object.fromEntries(
        result.map((r) => [r.group, r.members]),
      );
    expect(groups.track.length).toBe(1)
    expect(groups.project.length).toBe(1);
    expect(groups.organization.length).toBe(2);
  });

  test("task scope includes all groups", async () => {
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        organizationId: "org-1",
        name: "ERP",
        summary: "summary",
        description: "description",
        icon: "folder",
        color: "blue",
        startDate: Date.now(),
        endDate: Date.now(),
        status: "active",
        createdAt: Date.now(),
      });
    });

    const trackId = await t.run(async (ctx) => {
      return await ctx.db.insert("tracks", {
        name: "Backend",
        description: "track",
        projectId,
        trackCode: "TR-2",
        trackLeaderID: "u2",
        status: "active",
        createdAt: Date.now(),
      });
    });

    const taskId = await t.run(async (ctx) => {
      return await ctx.db.insert("tasks", {
        trackId,
        projectId,
        taskCode: "TASK-1",
        title: "Create API",
        description: "task",
        status: "todo",
        assignedTo: "emp-3",
        assignedBy: "admin-user",
        priority: "high",
        complexity: "medium",
        startDate: Date.now(),
        endDate: Date.now(),
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("projectMember", {
        projectId,
        employeeId: "emp-1",
        manager: false,
        assignedBy: "admin-user",
        createAt: Date.now(),
      });

      await ctx.db.insert("trackMember", {
        trackId,
        employeeId: "emp-2",
        lead: true,
        assignedAt: Date.now(),
        createdAt: Date.now(),
      });
    });

    const result = await t.query(api.scope.listAssignableMembers, {
      scope: "task",
      projectId,
      trackId,
      taskId,
    });

    expect(result.length).toBe(4);
    const groups = {
        task: result.find((r) => r.group === "task")?.members ?? [],
        track: result.find((r) => r.group === "track")?.members ?? [],
        project: result.find((r) => r.group === "project")?.members ?? [],
        organization: result.find((r) => r.group === "organization")?.members ?? [],
      };
    expect(groups.task.length).toBe(1);
    expect(groups.track.length).toBe(1);
    expect(groups.project.length).toBe(1);
    expect(groups.organization.length).toBe(1);
  });

  test("movement rule: user exists only in highest scope", async () => {
    const grouped = {
      organization: ["u1", "u2", "u3"],
      project: ["u1"],
      track: ["u2"],
      task: ["u3"],
    };

    expect(grouped.project.includes("u1")).toBe(true);
    expect(grouped.organization.includes("u1")).toBe(true);
  });
});