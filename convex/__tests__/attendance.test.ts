import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Attendance", () => {
  let t: TestConvexForDataModel<DataModel>;

  const employeeId = "employee-1";
  beforeEach(() => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });
  });

  test("createAttendance creates attendance record", async () => {
    const attendanceId = await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    expect(attendanceId).toBeDefined();

    const records = await t.query(api.attendance.listByEmployee, {
      employeeId,
    });

    expect(records.length).toBe(1);
    expect(records[0]?.status).toBe("present");
  });

  test("createAttendance prevents duplicate attendance for same date", async () => {
    await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    await expect(
      t.mutation(api.attendance.createAttendance, {
        employeeId,
        recordDate: 20240518,
        loginTime: Date.now(),
        status: "late",
      }),
    ).rejects.toThrow("Attendance already exists for this date");
  });

  test("listByEmployee returns employee attendance records", async () => {
    await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240519,
      loginTime: Date.now(),
      status: "late",
    });

    const records = await t.query(api.attendance.listByEmployee, {
      employeeId,
    });

    expect(records.length).toBe(2);
  });

  test("getAttendanceByDate returns attendance record", async () => {
    await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    const attendance = await t.query(api.attendance.getAttendanceByDate, {
      employeeId,
      recordDate: 20240518,
    });

    expect(attendance).not.toBeNull();
    expect(attendance?.status).toBe("present");
  });

  test("getAttendanceByDate returns null for missing record", async () => {
    const attendance = await t.query(api.attendance.getAttendanceByDate, {
      employeeId,
      recordDate: 20240518,
    });

    expect(attendance).toBeNull();
  });

  test("updateAttendance updates attendance record", async () => {
    const attendanceId = await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    await t.mutation(api.attendance.updateAttendance, {
      attendanceId,
      status: "half day",
    });

    const attendance = await t.query(api.attendance.getAttendanceByDate, {
      employeeId,
      recordDate: 20240518,
    });

    expect(attendance?.status).toBe("half day");
  });

  test("markLogout updates logoutTime", async () => {
    const attendanceId = await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    const logoutTime = Date.now();

    await t.mutation(api.attendance.markLogout, {
      attendanceId,
      logoutTime,
    });

    const attendance = await t.query(api.attendance.getAttendanceByDate, {
      employeeId,
      recordDate: 20240518,
    });

    expect(attendance?.logoutTime).toBe(logoutTime);
  });

  test("deleteAttendance removes attendance record", async () => {
    const attendanceId = await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    await t.mutation(api.attendance.deleteAttendance, {
      attendanceId,
    });

    const attendance = await t.query(api.attendance.getAttendanceByDate, {
      employeeId,
      recordDate: 20240518,
    });

    expect(attendance).toBeNull();
  });

  test("listTodayAttendance returns records within date range", async () => {
    await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 100,
      loginTime: Date.now(),
      status: "present",
    });

    await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 200,
      loginTime: Date.now(),
      status: "late",
    });

    const records = await t.query(api.attendance.listTodayAttendance, {
      startOfDay: 50,
      endOfDay: 150,
    });

    expect(records.length).toBe(1);
    expect(records[0]?.recordDate).toBe(100);
  });

  test("updateAttendance throws error for invalid attendance", async () => {
    const attendanceId = await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    await t.mutation(api.attendance.deleteAttendance, {
      attendanceId,
    });

    await expect(
      t.mutation(api.attendance.updateAttendance, {
        attendanceId,
        status: "present",
      }),
    ).rejects.toThrow("Attendance record not found");
  });

  test("deleteAttendance throws error for invalid attendance", async () => {
    const attendanceId = await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    await t.mutation(api.attendance.deleteAttendance, {
      attendanceId,
    });

    await expect(
      t.mutation(api.attendance.deleteAttendance, {
        attendanceId,
      }),
    ).rejects.toThrow("Attendance record not found");
  });

  test("markLogout throws error for invalid attendance", async () => {
    const attendanceId = await t.mutation(api.attendance.createAttendance, {
      employeeId,
      recordDate: 20240518,
      loginTime: Date.now(),
      status: "present",
    });

    // delete it first so it becomes "missing"
    await t.mutation(api.attendance.deleteAttendance, {
      attendanceId,
    });

    // now second call triggers your real error
    await expect(
      t.mutation(api.attendance.markLogout, {
        attendanceId,
        logoutTime: Date.now(),
      }),
    ).rejects.toThrow("Attendance record not found");
  });
});
