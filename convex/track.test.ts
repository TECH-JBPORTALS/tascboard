import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";
import type { DataModelFromSchemaDefinition } from "convex/server";
import type { GenericId } from "convex/values";

import { api } from "./_generated/api";
import projectTestSchema from "./projectTestSchema";
import { insertTestEmployee } from "./testHelpers";

type TrackTestDataModel = DataModelFromSchemaDefinition<typeof projectTestSchema>;

describe("Track", () => {
  let t: TestConvexForDataModel<TrackTestDataModel>;
  let projectId: GenericId<"projects">;
  let trackId: GenericId<"tracks">;

  beforeEach(async () => {
    t = convexTest(projectTestSchema).withIdentity({
      tokenIdentifier: "user-1",
    });

    const organizationId = await t.run(async (ctx) => {
      return await ctx.db.insert("organization", {
        name: "Test Org",
        slug: "test-org",
        createdAt: Date.now(),
      });
    });

    // Create project first
    projectId = await t.mutation(api.project.create, {
      organizationID: organizationId,
      name: "Project A",
      description: "Test project",
      startDate: 1700000000000,
      endDate: 1800000000000,
      status: "active",
    });

    const trackLeaderID = await insertTestEmployee(t);

    // Create track
    trackId = await t.mutation(api.track.create, {
      name: " Track A ",
      description: " Test track ",
      projectId,
      trackCode: "TRK-001",
      trackLeaderID,
      status: "active",
    });
  });

  // 1. CREATE TRACK
  test("create track", async () => {
    const track = await t.query(api.track.get, {
      trackId,
    });

    expect(track).not.toBeNull();
    expect(track?.name).toBe(" Track A ");
    expect(track?.description).toBe(" Test track ");
    expect(track?.projectId).toBe(projectId);
  });

  // 2. GET TRACK
  test("get returns track with project", async () => {
    const track = await t.query(api.track.get, {
      trackId,
    });

    expect(track?._id).toBe(trackId);
    expect(track?.project?.name).toBe("Project A");
  });

  // 3. UPDATE TRACK
  test("update track fields", async () => {
    await t.mutation(api.track.update, {
      trackId,
      body: {
        name: " Updated Track ",
        description: " Updated description ",
      },
    });

    const updated = await t.query(api.track.get, {
      trackId,
    });

    expect(updated?.name).toBe("Updated Track");
    expect(updated?.description).toBe("Updated description");
  });

  // 4. UPDATE VALIDATION
  test("update throws if track name is empty", async () => {
    await expect(
      t.mutation(api.track.update, {
        trackId,
        body: {
          name: "   ",
        },
      }),
    ).rejects.toThrow("Track name cannot be empty");
  });

  // 5. DELETE TRACK
  test("remove deletes track", async () => {
    await t.mutation(api.track.remove, {
      trackId,
    });

    const deleted = await t.query(api.track.get, {
      trackId,
    });

    expect(deleted).toBeNull();
  });

  // 6. REMOVE NON EXISTING TRACK
  test("remove throws when track does not exist", async () => {
    await t.mutation(api.track.remove, {
      trackId,
    });

    await expect(
      t.mutation(api.track.remove, {
        trackId,
      }),
    ).rejects.toThrow();
  });

  // 7. UPDATE TRIMS VALUES
  test("update trims name and description", async () => {
    await t.mutation(api.track.update, {
      trackId,
      body: {
        name: "   Trimmed Track   ",
        description: "   Trimmed Description   ",
      },
    });

    const updated = await t.query(api.track.get, {
      trackId,
    });

    expect(updated?.name).toBe("Trimmed Track");
    expect(updated?.description).toBe("Trimmed Description");
  });

  // 8. GET RETURNS NULL AFTER DELETE
  test("get returns null after track deletion", async () => {
    await t.mutation(api.track.remove, {
      trackId,
    });

    const deleted = await t.query(api.track.get, {
      trackId,
    });

    expect(deleted).toBeNull();
  });

  // 9. UPDATE NON EXISTING TRACK
  test("update throws if track does not exist", async () => {
    await t.mutation(api.track.remove, {
      trackId,
    });

    await expect(
      t.mutation(api.track.update, {
        trackId,
        body: {
          name: "Updated",
        },
      }),
    ).rejects.toThrow("Track not found");
  });
});