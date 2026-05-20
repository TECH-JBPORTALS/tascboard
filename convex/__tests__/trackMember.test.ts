import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Track Member", () => {
  let t: TestConvexForDataModel<DataModel>;

  let projectId: any;
  let trackId: any;

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    // 1. create project FIRST (required for track)
    projectId = await t.mutation(api.project.create, {
      name: "Test Project",
      summary: "test",
      icon: "📌",
      color: "blue",
      startDate: Date.now(),
      endDate: Date.now() + 1000000,
      status: "active",
    });

    // 2. create track using real projectId
    trackId = await t.mutation(api.track.create, {
      name: "Test Track",
      description: "desc",
      projectId,
      trackCode: "TRK-1",
      trackLeaderID: "user-1",
      status: "active",
    });
  });

  test("adds member to track", async () => {
    const memberId = await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });

    expect(memberId).toBeDefined();

    const members = await t.query(api.trackMember.list, {
      trackId,
    });

    expect(members.length).toBe(1);
    expect(members[0]?.lead).toBe(true);
  });

  test("prevents duplicate membership", async () => {
    await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: false,
    });

    await expect(
      t.mutation(api.trackMember.add, {
        trackId,
        employeeId: "user-1",
        lead: false,
      }),
    ).rejects.toThrow("Already a member");
  });

  test("only one lead allowed per track", async () => {
    await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });

    await expect(
      t.mutation(api.trackMember.add, {
        trackId,
        employeeId: "user-2",
        lead: true,
      }),
    ).rejects.toThrow("Lead already exists");
  });

  test("updates member lead status", async () => {
    const memberId = await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: false,
    });
  
    await t.mutation(api.trackMember.update, {
      memberId,
      lead: true,
    });
  
    const members = await t.query(api.trackMember.list, {
      trackId,
    });
  
    expect(members[0]?.lead).toBe(true);
  });

  test("prevents assigning second lead", async () => {
    const m1 = await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });
  
    const m2 = await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-2",
      lead: false,
    });
  
    await expect(
      t.mutation(api.trackMember.update, {
        memberId: m2,
        lead: true,
      }),
    ).rejects.toThrow("Lead already exists");
  });

  test("same lead can remain lead", async () => {
    const memberId = await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });
  
    // should NOT fail
    await t.mutation(api.trackMember.update, {
      memberId,
      lead: true,
    });
  
    const members = await t.query(api.trackMember.list, {
      trackId,
    });
  
    expect(members[0]?.lead).toBe(true);
  });
  test("non-member still cannot access update indirectly", async () => {
    const memberId = await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: false,
    });
  
    const t2 = convexTest(schema, modules).withIdentity({
      userId: "user-2",
      orgId: "org-1",
    });
  
    await expect(
      t2.mutation(api.trackMember.update, {
        memberId,
        lead: true,
      }),
    ).rejects.toThrow();
  });
  test("member can list track members", async () => {
    await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });

    const members = await t.query(api.trackMember.list, {
      trackId,
    });

    expect(members.length).toBe(1);
  });

  test("non-member cannot list track members", async () => {
 
    const t1 = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });
  
    const projectId = await t1.mutation(api.project.create, {
      name: "Test Project",
      summary: "test",
      icon: "📌",
      color: "blue",
      startDate: Date.now(),
      endDate: Date.now() + 100000,
      status: "active",
    });
  
    const trackId = await t1.mutation(api.track.create, {
      name: "Test Track",
      description: "desc",
      projectId,
      trackCode: "T-1",
      trackLeaderID: "user-1",
      status: "active",
    });
  
    await t1.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });
  
    const t2 = convexTest(schema, modules).withIdentity({
      userId: "user-2",
      orgId: "org-1",
    });
  
    await expect(
      t2.query(api.trackMember.list, { trackId }),
    ).rejects.toThrow("Not authorized");
  });
  test("member can access track", async () => {
    await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });

    const track = await t.query(api.trackMember.get, {
      trackId,
    });

    expect(track).not.toBeNull();
  });

  test("non-member cannot access track", async () => {
    await expect(
      t.query(api.trackMember.get, { trackId }),
    ).rejects.toThrow("Not authorized");
  });

  test("removing member revokes access", async () => {
    const memberId = await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });

    await t.mutation(api.trackMember.remove, {
      memberId,
    });

    await expect(
      t.query(api.trackMember.get, { trackId }),
    ).rejects.toThrow("Not authorized");
  });

  test("listTracks returns only user's tracks", async () => {
    await t.mutation(api.trackMember.add, {
      trackId,
      employeeId: "user-1",
      lead: true,
    });

    const tracks = await t.query(api.trackMember.listTracks, {});

    expect(tracks).toContain(trackId);
  });
});