import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";
import { DataModel, Id } from "./_generated/dataModel";

describe("Project", () => {
  let t: TestConvexForDataModel<DataModel>;
  let projectId: Id<"projects">;

  beforeEach(async () => {
    t = convexTest(schema).withIdentity({
      tokenIdentifier: "user-1",
    });

    projectId = await t.mutation(api.project.create, {
      name: " Project A ",
      description: " Test project ",
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
      },
    });

    const updated = await t.query(api.project.get, {
      projectId,
    });

    expect(updated?.name).toBe("Updated Project");
    expect(updated?.description).toBe("Updated description");
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
  test("remove does nothing if project does not exist", async () => {
    await t.mutation(api.project.remove, {
      projectId,
    });

    await expect(
      t.mutation(api.project.remove, {
        projectId,
      }),
    ).resolves.not.toThrow("This project doesn't exist");
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