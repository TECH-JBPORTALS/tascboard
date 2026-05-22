import { GenericCtx } from "@convex-dev/better-auth";
import { components } from "../_generated/api";
import { DataModel } from "../_generated/dataModel";

export type EmployeeRecord = {
  _id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: number;
  active: boolean;
};

export async function getEmployeeForUser(
  ctx: GenericCtx<DataModel>,
  organizationId: string,
  userId: string,
): Promise<EmployeeRecord | null> {
  const employee = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "employee",
    where: [
      { field: "organizationId", operator: "eq", value: organizationId },
      { field: "userId", operator: "eq", value: userId },
    ],
  });

  return (employee as EmployeeRecord | null) ?? null;
}

export async function listEmployeesByOrg(
  ctx: GenericCtx<DataModel>,
  organizationId: string
): Promise<EmployeeRecord[]> {
  const employees = await ctx.runQuery(
    components.betterAuth.adapter.findMany,
    {
      model: "employee",
      where: [
        { field: "organizationId", operator: "eq", value: organizationId },
      ],
      paginationOpts: {
        numItems: 1000,
        cursor: null,
      },
    }
  );

  return (employees as EmployeeRecord[]) ?? [];
}