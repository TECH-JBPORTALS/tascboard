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

    projects: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
    }),
    tracks: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      projectId: v.id("projects"),
    }).index("by_project", { fields: ["projectId"] }),
    tasks: defineTable({
      title: v.string(),
      description: v.optional(v.string()),
      status: v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("done"),
      ),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      dueDate: v.nullable(v.number()),
      trackId: v.id("tracks"),
    }).index("by_track", { fields: ["trackId"] }),
    
    labels: defineTable({
      name: v.string(),
      color: v.string(),
      projectId: v.id("projects"),
    }).index("by_project", { fields: ["projectId"] }),
    taskLabels: defineTable({
      taskId: v.id("tasks"),
      labelId: v.id("labels"),
    })
      .index("by_task", { fields: ["taskId"] })
      .index("by_label", { fields: ["labelId"] }),
    subtasks: defineTable({
      taskId: v.id("tasks"),
      title: v.string(),
      completed: v.boolean(),
      order: v.number(),
    }).index("by_task_and_order", { fields: ["taskId", "order"] }),
  
    activities: defineTable({
      taskId: v.id("tasks"),
      deviceName: v.string(),
      kind: v.union(
        v.literal("created"),
        v.literal("title_changed"),
        v.literal("status_changed"),
        v.literal("priority_changed"),
        v.literal("due_date_changed"),
        v.literal("label_added"),
        v.literal("label_removed"),
      ),
      fromValue: v.optional(v.string()),
      toValue: v.optional(v.string()),
      meta: v.optional(v.string()),
    }).index("by_task", { fields: ["taskId"] }),
  
    comments: defineTable({
      taskId: v.id("tasks"),
      // `null` for top-level (root of a thread), otherwise the parent comment's id
      parentCommentId: v.union(v.id("comments"), v.null()),
      deviceName: v.string(),
      body: v.string(),
      editedAt: v.optional(v.number()),
      // When true, marks this comment as the resolution of its thread
      isResolution: v.optional(v.boolean()),
    }).index("by_task", { fields: ["taskId"] }),
  
    sprints: defineTable({
      trackId: v.id("tracks"),
      sprintName: v.string(),
      goal: v.string(),
      startDate: v.number(),
      endDate: v.number(),
      status: v.union(v.literal("planned"), v.literal("active"), v.literal("completed")),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }).index("by_track", { fields: ["trackId"] }),
});
