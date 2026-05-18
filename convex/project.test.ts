import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";
import { DataModel, Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");

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
      description: " Test project ",
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: "active",
    });
  });

  test("create project", async () => {
    const project = await t.query(api.project.get, {
      projectId,
    });

    expect(project).not.toBeNull();

    expect(project?.name).toBe("Project A");
    expect(project?.description).toBe("Test project");
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

  test("update project fields", async () => {
    await t.mutation(api.project.update, {
      projectId,
      body: {
        name: " Updated Project ",
        description: " Updated description ",
        status: "completed",
      },
    });

    const updated = await t.query(api.project.get, {
      projectId,
    });

    expect(updated?.name).toBe("Updated Project");
    expect(updated?.description).toBe("Updated description");
    expect(updated?.status).toBe("completed");
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

  test("update trims name and description", async () => {
    await t.mutation(api.project.update, {
      projectId,
      body: {
        name: "   Trimmed Name   ",
        description: "   Trimmed Description   ",
      },
    });

    const updated = await t.query(api.project.get, {
      projectId,
    });

    expect(updated?.name).toBe("Trimmed Name");
    expect(updated?.description).toBe("Trimmed Description");
  });

  test("seedStarterProjects creates default projects", async () => {
    const isolated = convexTest(schema, modules).withIdentity({
      userId: "user-2",
      orgId: "org-2",
    });

    await isolated.mutation(api.project.seedStarterProjects);

    const projects = await isolated.query(api.project.list, {});

    expect(projects.length).toBeGreaterThanOrEqual(2);

    expect(
      projects.some((x) =>
        x.name.includes("Employee Attendance"),
      ),
    ).toBe(true);
  });

  test("seedStarterProjects is idempotent", async () => {
    const isolated = convexTest(schema, modules).withIdentity({
      userId: "user-3",
      orgId: "org-3",
    });

    await isolated.mutation(api.project.seedStarterProjects);
    await isolated.mutation(api.project.seedStarterProjects);

    const projects = await isolated.query(api.project.list, {});

    expect(projects.length).toBe(2);
  });

  test("list only returns current organization projects", async () => {
    await t.mutation(api.project.create, {
      name: "Other org project",
      startDate: 1,
      endDate: 2,
      status: "active",
    });
  
    const projects = await t.query(api.project.list, {});
  
    expect(projects.length).toBe(2);
  
    expect(projects.every(p => p.organizationId === "org-1")).toBe(true);
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