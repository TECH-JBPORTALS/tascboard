import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),

  inboxItems: defineTable({
    organizationId: v.string(),
    recipientUserId: v.string(),
    kind: v.union(
      v.literal("assignment"),
      v.literal("comment"),
      v.literal("invite"),
      v.literal("system"),
    ),
    title: v.string(),
    snippet: v.optional(v.string()),
    body: v.optional(v.string()),
    read: v.boolean(),
    archived: v.boolean(),
    actorName: v.optional(v.string()),
  })
    .index("by_org_recipient_archived", [
      "organizationId",
      "recipientUserId",
      "archived",
    ])
    .index("by_org_recipient_archived_read", [
      "organizationId",
      "recipientUserId",
      "archived",
      "read",
    ]),
});
