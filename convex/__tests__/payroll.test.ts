import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api, internal } from "../_generated/api";
import schema from "../schema";
import { DataModel } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("Payroll", () => {
  let t: TestConvexForDataModel<DataModel>;

  beforeEach(() => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });
  });

  test("create inserts payroll record", async () => {
    const id = await t.mutation(internal.payroll.create, {
      employeeId: "emp-1",
      creditedAt: Date.now(),
      basicSalary: 1000,
      deduction: 100,
      overtimePay: 50,
      bonus: 200,
      netSalary: 1150,
    });

    expect(id).toBeDefined();

    const records = await t.query(api.payroll.list, {
      employeeId: "emp-1",
    });

    expect(records.length).toBe(1);
  });

  test("list filters by employeeId", async () => {
    await t.mutation(internal.payroll.create, {
      employeeId: "emp-1",
      creditedAt: Date.now(),
      basicSalary: 1000,
      deduction: 0,
      overtimePay: 0,
      bonus: 0,
      netSalary: 1000,
    });

    await t.mutation(internal.payroll.create, {
      employeeId: "emp-2",
      creditedAt: Date.now(),
      basicSalary: 2000,
      deduction: 0,
      overtimePay: 0,
      bonus: 0,
      netSalary: 2000,
    });

    const records = await t.query(api.payroll.list, {
      employeeId: "emp-1",
    });

    expect(records.length).toBe(1);
    expect(records[0]?.employeeId).toBe("emp-1");
  });

  test("get returns record", async () => {
    const id = await t.mutation(internal.payroll.create, {
      employeeId: "emp-1",
      creditedAt: Date.now(),
      basicSalary: 1000,
      deduction: 0,
      overtimePay: 0,
      bonus: 0,
      netSalary: 1000,
    });

    const record = await t.query(api.payroll.get, { id });

    expect(record).not.toBeNull();
    expect(record?.employeeId).toBe("emp-1");
  });

  test("get returns null for invalid id", async () => {
    const id = await t.mutation(internal.payroll.create, {
      employeeId: "emp-temp",
      creditedAt: Date.now(),
      basicSalary: 1000,
      deduction: 0,
      overtimePay: 0,
      bonus: 0,
      netSalary: 1000,
    });
  
    await t.mutation(api.payroll.remove, { id });
  
    const record = await t.query(api.payroll.get, { id });
  
    expect(record).toBeNull();
  });

  test("update modifies payroll", async () => {
    const id = await t.mutation(internal.payroll.create, {
      employeeId: "emp-1",
      creditedAt: Date.now(),
      basicSalary: 1000,
      deduction: 0,
      overtimePay: 0,
      bonus: 0,
      netSalary: 1000,
    });

    await t.mutation(api.payroll.update, {
      id,
      bonus: 500,
      netSalary: 1500,
    });

    const record = await t.query(api.payroll.get, { id });

    expect(record?.bonus).toBe(500);
    expect(record?.netSalary).toBe(1500);
    expect(record?.updatedAt).toBeDefined();
  });

  test("remove deletes payroll", async () => {
    const id = await t.mutation(internal.payroll.create, {
      employeeId: "emp-1",
      creditedAt: Date.now(),
      basicSalary: 1000,
      deduction: 0,
      overtimePay: 0,
      bonus: 0,
      netSalary: 1000,
    });

    await t.mutation(api.payroll.remove, { id });

    const record = await t.query(api.payroll.get, { id });

    expect(record).toBeNull();
  });

  test("getSummary aggregates values", async () => {
    await t.mutation(internal.payroll.create, {
      employeeId: "emp-1",
      creditedAt: Date.now(),
      basicSalary: 1000,
      deduction: 100,
      overtimePay: 50,
      bonus: 200,
      netSalary: 1150,
    });

    await t.mutation(internal.payroll.create, {
      employeeId: "emp-1",
      creditedAt: Date.now(),
      basicSalary: 2000,
      deduction: 200,
      overtimePay: 100,
      bonus: 300,
      netSalary: 2200,
    });

    const summary = await t.query(api.payroll.getSummary, {
      employeeId: "emp-1",
    });

    expect(summary.totalBasicSalary).toBe(3000);
    expect(summary.totalDeduction).toBe(300);
    expect(summary.totalOvertimePay).toBe(150);
    expect(summary.totalBonus).toBe(500);
    expect(summary.totalNetSalary).toBe(3350);
  });
});