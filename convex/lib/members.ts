import { GenericCtx } from "@convex-dev/better-auth";
import { components } from "../_generated/api";
import { DataModel } from "../_generated/dataModel";

type MemberRecord = {
  _id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: number;
};

export async function getMemberForUser(
  ctx: GenericCtx<DataModel>,
  organizationId: string,
  userId: string,
): Promise<MemberRecord | null> {
  const member = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "member",
    where: [
      { field: "organizationId", operator: "eq", value: organizationId },
      { field: "userId", operator: "eq", value: userId },
    ],
  });

  return (member as MemberRecord | null) ?? null;
}
