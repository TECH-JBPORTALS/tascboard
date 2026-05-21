import { GenericCtx } from "@convex-dev/better-auth";
import { components } from "../_generated/api";
import { DataModel } from "../_generated/dataModel";

type UserRecord = {
  email: string;
  name: string;
  image?: string | null;
};

export async function getUserByUserId(
  ctx: GenericCtx<DataModel>,
  userId: string,
): Promise<UserRecord | null> {
  const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [
      {
        field: "userId", // IMPORTANT: matches your schema index
        operator: "eq",
        value: userId,
      },
    ],
  });

  return (user as UserRecord | null) ?? null;
}