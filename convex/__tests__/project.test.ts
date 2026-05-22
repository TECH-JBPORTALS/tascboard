import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api, internal } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Project", () => {
  let t: TestConvexForDataModel<DataModel>;
  let projectId: Id<"projects">;
  
  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });
    projectId = await t.mutation(api.project.create, {
      name: " Project A ",
      summary: " Test project ",
      icon: "📁",
      color: "purple",
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: "active",
    });

    await t.mutation(api.projectMember.toggleMember, {
      projectId,
      employeeId: "emp-1",
    });
    
    await t.mutation(api.projectMember.toggleMember, {
      projectId,
      employeeId: "emp-2",
    });
    
    await t.mutation(api.projectMember.setManager, {
      projectId,
      employeeId: "emp-1",
    });
  });

  test("create project", async () => {
    const project = await t.query(api.project.get, {
      projectId,
    });

    expect(project).not.toBeNull();

    expect(project?.name).toBe("Project A");
    expect(project?.summary).toBe("Test project");
    expect(project?.status).toBe("active");
  });

  test("list returns organization projects", async () => {
    const projects = await t.query(api.project.list, {});

    expect(projects.length).toBe(1);
    expect(projects[0]?.name).toBe("Project A");
    expect(Array.isArray(projects[0]?.tracks)).toBe(true);
  });

  test("get returns project by id", async () => {
    const project = await t.query(api.project.get, {
      projectId,
    });

    expect(project?._id).toBe(projectId);
    expect(project?.name).toBe("Project A");
  });

  test("get returns project members and manager", async () => {
    const project = await t.query(api.project.get, {
      projectId,
    });
  
    expect(project?.members.length).toBe(2);
  
    expect(project?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: "emp-1",
        }),
        expect.objectContaining({
          employeeId: "emp-2",
        }),
      ]),
    );
  
    expect(project?.manager).toEqual(
      expect.objectContaining({
        employeeId: "emp-1",
      }),
    );
  });
  test("update project fields", async () => {
    await t.mutation(api.project.update, {
      projectId,
      body: {
        name: " Updated Project ",
        summary: " Updated summary ",
        status: "terminated",
      },
    });

    const updated = await t.query(api.project.get, {
      projectId,
    });

    expect(updated?.name).toBe("Updated Project");
    expect(updated?.summary).toBe("Updated summary");
    expect(updated?.status).toBe("terminated");
    expect(updated?.updatedAt).toBeTypeOf("number");
  });

  test("update throws if project name is empty", async () => {
    await expect(
      t.mutation(api.project.update, {
        projectId,
        body: {
          name: "   ",
        },
      }),
    ).rejects.toThrow("Project name cannot be empty");
  });

  test("remove deletes project", async () => {
    await t.mutation(api.project.remove, {
      projectId,
    });

    await expect(
      t.query(api.project.get, {
        projectId,
      }),
    ).resolves.toBeNull();
  });

  test("remove throws if project does not exist", async () => {
    await t.mutation(api.project.remove, {
      projectId,
    });

    await expect(
      t.mutation(api.project.remove, {
        projectId,
      }),
    ).rejects.toThrow("Not found");
  });

  test("update trims name and summary", async () => {
    await t.mutation(api.project.update, {
      projectId,
      body: {
        name: "   Trimmed Name   ",
        summary: "   Trimmed Summary   ",
      },
    });

    const updated = await t.query(api.project.get, {
      projectId,
    });

    expect(updated?.name).toBe("Trimmed Name");
    expect(updated?.summary).toBe("Trimmed Summary");
  });

  test("update rejects end date before start date", async () => {
    await expect(
      t.mutation(api.project.update, {
        projectId,
        body: {
          endDate: 1600000000000,
        },
      }),
    ).rejects.toThrow("End date cannot be before start date");
  });

  test("create logs activity and updateDescription does not", async () => {
    const afterCreate = await t.query(api.projectActivity.list, {
      projectId,
    });

    expect(afterCreate.length).toBe(1);
    expect(afterCreate[0]?.kind).toBe("created");

    await t.mutation(api.project.update, {
      projectId,
      body: { status: "inactive" },
    });

    await t.mutation(api.project.updateDescription, {
      projectId,
      description: [{ type: "p", children: [{ text: "Docs" }] }],
    });

    const activities = await t.query(api.projectActivity.list, {
      projectId,
    });

    expect(activities.some((a) => a.kind === "status_changed")).toBe(true);
    expect(activities.some((a) => a.kind === "created")).toBe(true);
    expect(activities.length).toBe(2);
  });

  test("updateDescription saves plate content", async () => {
    const plateValue = [
      { type: "p", children: [{ text: "Rich project description" }] },
    ];

    await t.mutation(api.project.updateDescription, {
      projectId,
      description: plateValue,
    });

    const updated = await t.query(api.project.get, { projectId });

    expect(updated?.description).toEqual(plateValue);
  });

  test("seedStarterProjects creates default projects", async () => {
    const isolated = convexTest(schema, modules).withIdentity({
      userId: "user-2",
      orgId: "org-2",
    });

    await isolated.mutation(internal.project.seedStarterProjects);

    const projects = await isolated.query(api.project.list, {});

    expect(projects.length).toBeGreaterThanOrEqual(2);

    expect(projects.some((x) => x.name.includes("Employee Attendance"))).toBe(
      true,
    );
  });

  test("seedStarterProjects is idempotent", async () => {
    const isolated = convexTest(schema, modules).withIdentity({
      userId: "user-3",
      orgId: "org-3",
    });

    await isolated.mutation(internal.project.seedStarterProjects);
    await isolated.mutation(internal.project.seedStarterProjects);

    const projects = await isolated.query(api.project.list, {});

    expect(projects.length).toBe(2);
  });

  test("list only returns current organization projects", async () => {
    await t.mutation(api.project.create, {
      name: "Other org project",
      icon: "📁",
      color: "purple",
      startDate: 1,
      endDate: 2,
      status: "active",
    });

    const projects = await t.query(api.project.list, {});

    expect(projects.length).toBe(2);

    expect(projects.every((p) => p.organizationId === "org-1")).toBe(true);
  });

  test("users cannot access another organization's project", async () => {
    const isolated = convexTest(schema, modules).withIdentity({
      userId: "user-2",
      orgId: "org-2",
    });

    await expect(
      isolated.query(api.project.get, {
        projectId,
      }),
    ).resolves.toBeNull();
  });

  test("users cannot access another org project", async () => {
    const owner = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    const projectId = await owner.mutation(api.project.create, {
      name: "Private Project",
      icon: "📁",
      color: "purple",
      startDate: 1,
      endDate: 2,
      status: "active",
    });

    const attacker = convexTest(schema, modules).withIdentity({
      userId: "user-2",
      orgId: "org-2",
    });

    await expect(
      attacker.query(api.project.get, {
        projectId,
      }),
    ).resolves.toBeNull();
  });
});
