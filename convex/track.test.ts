import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";
import { DataModel, Id } from "./_generated/dataModel";

describe("Track", () => {
  let t: TestConvexForDataModel<DataModel>;
  let projectId: Id<"projects">;
  let trackId: Id<"tracks">;

  beforeEach(async () => {
    t = convexTest(schema).withIdentity({
      tokenIdentifier: "user-1",
    });

    // Create project first
    projectId = await t.mutation(api.project.create, {
      name: "Project A",
      description: "Test project",
    });

    // Create track
    trackId = await t.mutation(api.track.create, {
      name: " Track A ",
      description: " Test track ",
      projectId,
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