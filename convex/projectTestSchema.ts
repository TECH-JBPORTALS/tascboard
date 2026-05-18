import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { appTables } from "./schemaTables";

/**
 * App schema plus tables referenced by `v.id(...)` that live outside schema.ts
 * (Better Auth component orgs, track leaders, HR employee records).
 */
export default defineSchema({
  organization: defineTable({
    name: v.string(),
    slug: v.string(),
    logo: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    metadata: v.optional(v.union(v.null(), v.string())),
  })
    .index("name", ["name"])
    .index("slug", ["slug"]),

  employee: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),

  users: defineTable({
    name: v.string(),
  }),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    createdAt: v.number(),
  }),

  ...appTables,
});
