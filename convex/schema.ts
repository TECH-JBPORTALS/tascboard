import { organization } from "better-auth/plugins";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { id } from "zod/v4/locales";

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
      organizationID: v.id("organization"),
      name: v.string(),
      description: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      status: v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived"),
        v.literal("on hold")
      ),
      createdAt: v.number(),
      updatedAt: v.optional(v.number())
    }),

    tracks: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      projectId: v.id("projects"),
      trackCode: v.string(),
      trackLeaderID: v.id("employee"),
      status: v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      ),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),

    }).index("by_project", { fields: ["projectId"] }),

    employees: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),

    employeeCode: v.string(),

    designation: v.string(),

    joiningDate: v.number(),

    ctc: v.number(),

    leaveQuota: v.number(),

    employmentType: v.union(
      v.literal("fulltime"),
      v.literal("intern"),
      v.literal("contract")
    ),

    workMode: v.union(
      v.literal("wfh"),
      v.literal("hybrid"),
      v.literal("onsite")
    ),

    workLocation: v.string(),

    profileImage: v.string(),

    address: v.string(),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    postal_code: v.string(),

    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),

    bloodGroup: v.string(),

    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("terminated")
    ),

    relievingDate: v.number(),

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),

  bankName: v.string(),
    bankAccountNumber: v.string(),
    branchName: v.string(),
    ifscCode: v.string(),
}).index("by_organization", { fields: ["organizationId"] }),

  employeePerformancePoints: defineTable({
    employeeId: v.id("employees"),
    taskId: v.id("tasks"),

    points: v.number(),

    awardedBy: v.id("users"), 

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_task", ["taskId"]),

  attendance: defineTable({
    employeeId: v.id("employees"),
    recordDate: v.number(),
    loginTime: v.number(),
    logoutTime: v.optional(v.number()),
    status: v.union(
      v.literal("present"),
      v.literal("on leave"), 
      v.literal("late"),
      v.literal("half day")
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_employee_and_date", ["employeeId", "recordDate"])
  .index("by_employee", ["employeeId"]),



  leaveRequests: defineTable({
  employeeId: v.id("employees"),

  leaveType: v.union(
    v.literal("sick"),
    v.literal("casual"),
    v.literal("emergency")
  ),

  startDate: v.number(),
  endDate: v.number(),
  reason: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected")
  ),
  approvedBy: v.optional(v.id("users")),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_employee", ["employeeId"])
  .index("by_status", ["status"])
  .index("by_approved_by", ["approvedBy"]),

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
