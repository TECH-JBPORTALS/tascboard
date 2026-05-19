import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Leave Requests", () => {
  let t: TestConvexForDataModel<DataModel>;

  beforeEach(() => {
    t = convexTest(schema, modules).withIdentity({
      userId: "emp-1",
      orgId: "org-1",
    });
  });

  test("raise creates leave request", async () => {
    const res = await t.mutation(api.leaveRequest.raise, {
      employeeId: "emp-1",
      leaveType: "sick",
      startDate: 1000000,
      endDate: 2000000,
      reason: "fever",
    });

    expect(res.success).toBe(true);

    const balance = await t.query(api.leaveRequest.getLeaveBalance, {
      employeeId: "emp-1",
    });

    expect(balance.employeeId).toBe("emp-1");
  });

  test("reject invalid date range", async () => {
    await expect(
      t.mutation(api.leaveRequest.raise, {
        employeeId: "emp-1",
        leaveType: "casual",
        startDate: 2000000,
        endDate: 1000000,
        reason: "bad",
      }),
    ).rejects.toThrow("Invalid date range");
  });

  test("approve leave request", async () => {
    const { requestId } = await t.mutation(api.leaveRequest.raise, {
      employeeId: "emp-1",
      leaveType: "casual",
      startDate: 1000000,
      endDate: 2000000,
      reason: "trip",
    });

    const res = await t.mutation(api.leaveRequest.approveLeaveRequest, {
      leaveRequestId: requestId,
      approvedBy: "admin-1",
    });

    expect(res.success).toBe(true);
    expect(res.approvedDays).toBeGreaterThan(0);
  });

  test("reject leave request", async () => {
    const { requestId } = await t.mutation(api.leaveRequest.raise, {
      employeeId: "emp-1",
      leaveType: "casual",
      startDate: 1000000,
      endDate: 2000000,
      reason: "trip",
    });

    const res = await t.mutation(api.leaveRequest.rejectLeaveRequest, {
      leaveRequestId: requestId,
      approvedBy: "manager-1",
      reason: "not allowed",
    });

    expect(res.success).toBe(true);
  });

  test("cancel leave request", async () => {
    const { requestId } = await t.mutation(api.leaveRequest.raise, {
      employeeId: "emp-1",
      leaveType: "casual",
      startDate: 1000000,
      endDate: 2000000,
      reason: "trip",
    });

    const res = await t.mutation(api.leaveRequest.cancelLeaveRequest, {
      leaveRequestId: requestId,
    });

    expect(res.success).toBe(true);
  });

  test("get leave balance returns correct structure", async () => {
    const res = await t.query(api.leaveRequest.getLeaveBalance, {
      employeeId: "emp-1",
    });

    expect(res).toHaveProperty("leaveQuota");
    expect(res).toHaveProperty("usedLeaves");
    expect(res).toHaveProperty("remaining");
  });

  test("assign monthly leaves works", async () => {
    const res = await t.query(api.leaveRequest.assignMonthlyLeaves, {
      employeeId: "emp-1",
      month: 1,
      year: 2026,
    });

    expect(res).toHaveProperty("suggestedMonthlyLimit");
  });

  test("assign yearly leaves works", async () => {
    const res = await t.query(api.leaveRequest.assignYearlyLeaves, {
      employeeId: "emp-1",
      year: 2026,
    });

    expect(res).toHaveProperty("yearlyQuota");
    expect(res).toHaveProperty("usedLeaves");
    expect(res).toHaveProperty("remainingLeaves");
  });

  test("cannot approve already processed request", async () => {
    const { requestId } = await t.mutation(api.leaveRequest.raise, {
      employeeId: "emp-1",
      leaveType: "casual",
      startDate: 1000000,
      endDate: 2000000,
      reason: "trip",
    });

    await t.mutation(api.leaveRequest.approveLeaveRequest, {
      leaveRequestId: requestId,
      approvedBy: "admin-1",
    });

    await expect(
      t.mutation(api.leaveRequest.approveLeaveRequest, {
        leaveRequestId: requestId,
        approvedBy: "admin-1",
      }),
    ).rejects.toThrow("Request already processed");
  });

  test("cannot reject non-existent request", async () => {
    await expect(
      t.mutation(api.leaveRequest.rejectLeaveRequest, {
        leaveRequestId: "non-existent" as any,
        approvedBy: "admin-1",
      }),
    ).rejects.toThrow();
  });
});