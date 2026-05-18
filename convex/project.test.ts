import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";
import type { DataModelFromSchemaDefinition } from "convex/server";
import type { GenericId } from "convex/values";

import { api } from "./_generated/api";
import projectTestSchema from "./projectTestSchema";

type ProjectTestDataModel = DataModelFromSchemaDefinition<
  typeof projectTestSchema
>;

describe("Project", () => {
  let t: TestConvexForDataModel<ProjectTestDataModel>;
  let organizationId: GenericId<"organization">;
  let projectId: GenericId<"projects">;

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

    projectId = await t.mutation(api.project.create, {
      organizationID: organizationId,
      name: " Project A ",
      description: " Test project ",
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: "active",
    });
  });

  // 1. CREATE PROJECT
  test("create project", async () => {
    const project = await t.query(api.project.get, {
      projectId,
    });

    expect(project).not.toBeNull();
    expect(project?.name).toBe(" Project A ");
    expect(project?.description).toBe(" Test project ");
    expect(project?.organizationID).toBe(organizationId);
    expect(project?.status).toBe("active");
    expect(typeof project?.startDate).toBe("number");
    expect(typeof project?.endDate).toBe("number");
  });

  // 2. GET ALL PROJECTS
  test("getAll returns all projects", async () => {
    const projects = await t.query(api.project.getAll, {});

    expect(projects.length).toBe(1);
    expect(projects[0].name).toBe(" Project A ");
    expect(Array.isArray(projects[0].tracks)).toBe(true);
  });

  // 3. GET PROJECT
  test("get returns project by id", async () => {
    const project = await t.query(api.project.get, {
      projectId,
    });

    expect(project?._id).toBe(projectId);
    expect(project?.name).toBe(" Project A ");
  });

  // 4. UPDATE PROJECT
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

  // 5. UPDATE VALIDATION
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

  // 6. DELETE PROJECT
  test("remove deletes project", async () => {
    await t.mutation(api.project.remove, {
      projectId,
    });

    const project = await t.query(api.project.get, {
      projectId,
    });

    expect(project).toBeNull();
  });

  // 7. REMOVE NON EXISTING PROJECT
  test("remove throws if project does not exist", async () => {
    await t.mutation(api.project.remove, {
      projectId,
    });
  
    await expect(
      t.mutation(api.project.remove, {
        projectId,
      }),
    ).rejects.toThrow("Project not found");
  });

  // 8. UPDATE TRIMS VALUES
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

  // 9. GET RETURNS NULL FOR DELETED PROJECT
  test("get returns null after project deletion", async () => {
    await t.mutation(api.project.remove, {
      projectId,
    });

    const deleted = await t.query(api.project.get, {
      projectId,
    });

    expect(deleted).toBeNull();
  });

  // 10. GETALL RETURNS EMPTY ARRAY
  test("getAll returns empty array when no projects exist", async () => {
    await t.mutation(api.project.remove, {
      projectId,
    });

    const projects = await t.query(api.project.getAll, {});

    expect(projects.length).toBe(0);
  });
});