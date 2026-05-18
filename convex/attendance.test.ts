import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";
import { DataModel, Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");

describe("Attendance", () => {
  let t: TestConvexForDataModel<DataModel>;
  let employeeId: Id<"employees">;

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    employeeId = await t.mutation(api.employee.create, {
      userId: "user-1",
      organizationId: "org-1",
      employeeCode: "EMP001",
      designation: "Developer",
      joiningDate: Date.now(),
      ctc: 100000,
      leaveQuota: 10,
      employmentType: "fulltime",
      workMode: "wfh",
      workLocation: "Remote",
      profileImage: "img.png",
      address: "addr",
      city: "city",
      state: "state",
      country: "country",
      postal_code: "123",
      emergencyContactName: "John",
      emergencyContactPhone: "9999999999",
      bloodGroup: "O+",
      status: "active",
      relievingDate: 0,
      bankName: "bank",
      bankAccountNumber: "123",
      branchName: "branch",
      ifscCode: "IFSC",
    });
  });

  test("mark attendance successfully", async () => {
    const loginTime = new Date("2026-05-18T09:00:00Z").getTime();

    const id = await t.mutation(api.attendance.markAttendance, {
      employeeId,
      loginTime,
    });

    expect(id).toBeDefined();
  });

  test("throws if attendance already exists", async () => {
    const loginTime = new Date("2026-05-18T09:00:00Z").getTime();

    await t.mutation(api.attendance.markAttendance, {
      employeeId,
      loginTime,
    });

    await expect(
      t.mutation(api.attendance.markAttendance, {
        employeeId,
        loginTime,
      })
    ).rejects.toThrow("Attendance already marked for today");
  });

  test("mark logout updates record", async () => {
    const loginTime = new Date("2026-05-18T09:00:00Z").getTime();
    const logoutTime = new Date("2026-05-18T18:00:00Z").getTime();

    await t.mutation(api.attendance.markAttendance, {
      employeeId,
      loginTime,
    });

    await t.mutation(api.attendance.markLogout, {
      employeeId,
      logoutTime,
    });

    const records = await t.query(api.attendance.getEmployeeAttendance, {
      employeeId,
    });

    expect(records.length).toBe(1);
    expect(records[0].logoutTime).toBeDefined();
  });

  test("marks half day if worked less than 4 hours", async () => {
    const loginTime = new Date("2026-05-18T09:00:00Z").getTime();
    const logoutTime = new Date("2026-05-18T11:00:00Z").getTime();

    await t.mutation(api.attendance.markAttendance, {
      employeeId,
      loginTime,
    });

    await t.mutation(api.attendance.markLogout, {
      employeeId,
      logoutTime,
    });

    const records = await t.query(api.attendance.getEmployeeAttendance, {
      employeeId,
    });

    expect(records[0].status).toBe("half day");
  });

  test("list attendance by employee", async () => {
    const loginTime = new Date("2026-05-18T09:00:00Z").getTime();

    await t.mutation(api.attendance.markAttendance, {
      employeeId,
      loginTime,
    });

    const records = await t.query(api.attendance.getEmployeeAttendance, {
      employeeId,
    });

    expect(records.length).toBe(1);
  });

  test("filter by status", async () => {
    const loginTime = new Date("2026-05-18T09:00:00Z").getTime();

    await t.mutation(api.attendance.markAttendance, {
      employeeId,
      loginTime,
    });

    const result = await t.query(api.attendance.filterAttendance, {
      status: "present",
    });

    expect(result.length).toBeGreaterThan(0);
  });

  test("attendance report returns summary", async () => {
    const loginTime = new Date("2026-05-18T09:00:00Z").getTime();

    await t.mutation(api.attendance.markAttendance, {
      employeeId,
      loginTime,
    });

    const report = await t.query(api.attendance.getAttendanceReport, {
      employeeId,
      startDate: loginTime - 1000,
      endDate: loginTime + 1000,
    });

    expect(report.summary.totalDays).toBe(1);
    expect(report.records.length).toBe(1);
  });
});