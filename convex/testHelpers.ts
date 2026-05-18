import type { TestConvexForDataModel } from "convex-test";
import type { DataModelFromSchemaDefinition } from "convex/server";
import type { GenericId } from "convex/values";

import projectTestSchema from "./projectTestSchema";

export type ProjectTestDataModel = DataModelFromSchemaDefinition<
  typeof projectTestSchema
>;

export async function insertTestEmployee(
  t: TestConvexForDataModel<ProjectTestDataModel>,
): Promise<GenericId<"employee">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("employee", {
      name: "Test Leader",
      createdAt: Date.now(),
    });
  });
}
