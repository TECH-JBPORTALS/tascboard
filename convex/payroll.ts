import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireIdentity } from "./lib/auth";

const payrollReturn = v.object({
  _id: v.id("payroll"),
  _creationTime: v.number(),
  employeeId: v.string(),
  creditedAt: v.number(),
  basicSalary: v.float64(),
  deduction: v.float64(),
  overtimePay: v.float64(),
  bonus: v.float64(),
  netSalary: v.float64(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const create = internalMutation({
  args: {
    employeeId: v.string(),
    creditedAt: v.number(),
    basicSalary: v.float64(),
    deduction: v.float64(),
    overtimePay: v.float64(),
    bonus: v.float64(),
    netSalary: v.float64(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const payrollId = await ctx.db.insert("payroll", {
      ...args,
      createdAt: now,
      updatedAt: undefined,
    });

    return payrollId;
  },
});

export const list = query({
  args: {
    employeeId: v.string(),
  },
  returns: v.array(payrollReturn),
  handler: async (ctx, args) => {
    const records = await ctx.db.query("payroll").collect();

    return records
      .filter((p) => p.employeeId === args.employeeId)
      .sort((a, b) => b.creditedAt - a.creditedAt);
  },
});

export const get = query({
  args: {
    id: v.id("payroll"),
  },
  returns: v.union(payrollReturn, v.null()),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    return record ?? null;
  },
});

export const update = mutation({
  args: {
    id: v.id("payroll"),
    basicSalary: v.optional(v.float64()),
    deduction: v.optional(v.float64()),
    overtimePay: v.optional(v.float64()),
    bonus: v.optional(v.float64()),
    netSalary: v.optional(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const record = await ctx.db.get(id);
    if (!record) {
      throw new Error("Payroll record not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    id: v.id("payroll"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) {
      throw new Error("Payroll record not found");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

export const getSummary = query({
  args: {
    employeeId: v.string(),
  },
  returns: v.object({
    totalBasicSalary: v.float64(),
    totalDeduction: v.float64(),
    totalOvertimePay: v.float64(),
    totalBonus: v.float64(),
    totalNetSalary: v.float64(),
  }),
  handler: async (ctx, args) => {
    const records = await ctx.db.query("payroll").collect();

    const filtered = records.filter((p) => p.employeeId === args.employeeId);

    return filtered.reduce(
      (acc, p) => {
        acc.totalBasicSalary += p.basicSalary;
        acc.totalDeduction += p.deduction;
        acc.totalOvertimePay += p.overtimePay;
        acc.totalBonus += p.bonus;
        acc.totalNetSalary += p.netSalary;
        return acc;
      },
      {
        totalBasicSalary: 0,
        totalDeduction: 0,
        totalOvertimePay: 0,
        totalBonus: 0,
        totalNetSalary: 0,
      },
    );
  },
});