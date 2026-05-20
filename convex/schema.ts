import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { projectColorValidator } from "./lib/projectAppearance";

export const onboardingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
);

export const employeeProfileSchema = v.object({
  employeeId: v.string(),
  onboardingStatus: onboardingStatusValidator,
  onboardingStep: v.number(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  address: v.optional(v.string()),
  aadharNumber: v.optional(v.string()),
  panNumber: v.optional(v.string()),
  bankAccountNumber: v.optional(v.string()),
  bankName: v.optional(v.string()),
  ifscCode: v.optional(v.string()),
  branchName: v.optional(v.string()),
  profilePhotoStorageId: v.optional(v.id("_storage")),
});

export default defineSchema({
  inboxItems: defineTable({
    organizationId: v.string(),
    recipientUserId: v.string(),
    kind: v.union(
      v.literal("assignment"),
      v.literal("comment"),
      v.literal("invite"),
      v.literal("system"),
      v.literal("onboarding"),
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

  employeeProfiles: defineTable(employeeProfileSchema).index("by_employee", [
    "employeeId",
  ]),

  employeeCertificates: defineTable({
    employeeProfileId: v.id("employeeProfiles"),
    organizationId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    contentType: v.string(),
  }).index("by_profile", ["employeeProfileId"]),
  projects: defineTable({
    organizationId: v.string(),
    name: v.string(),
    summary: v.optional(v.string()),
    description: v.optional(v.any()),
    icon: v.optional(v.string()),
    color: v.optional(projectColorValidator),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("terminated"),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_organization", ["organizationId"]),

  projectActivities: defineTable({
    projectId: v.id("projects"),
    organizationId: v.string(),
    actorUserId: v.string(),
    actorName: v.string(),
    kind: v.union(
      v.literal("created"),
      v.literal("name_changed"),
      v.literal("summary_changed"),
      v.literal("status_changed"),
      v.literal("start_date_changed"),
      v.literal("end_date_changed"),
      v.literal("icon_changed"),
      v.literal("color_changed"),
    ),
    fromValue: v.optional(v.string()),
    toValue: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  tracks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    trackCode: v.string(),
    trackLeaderID: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_project", { fields: ["projectId"] }),

  employeePerformancePoints: defineTable({
    employeeId: v.id("employee"),
    taskId: v.id("tasks"),
    points: v.number(),
    awardedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_task", ["taskId"]),

  attendance: defineTable({
    employeeId: v.string(),
    recordDate: v.number(),
    loginTime: v.number(),
    logoutTime: v.optional(v.number()),
    status: v.union(
      v.literal("present"),
      v.literal("on leave"),
      v.literal("late"),
      v.literal("half day"),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_employee_and_date", ["employeeId", "recordDate"])
    .index("by_employee", ["employeeId"]),

  leaveRequests: defineTable({
    employeeId: v.string(),

    leaveType: v.union(
      v.literal("sick"),
      v.literal("casual"),
      v.literal("emergency"),
    ),

    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    approvedBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_status", ["status"])
    .index("by_approved_by", ["approvedBy"]),

  tasks: defineTable({
    trackId: v.id("tracks"),
    projectId: v.id("projects"),
    taskCode: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
    ),
    assignedTo: v.string(),
    assignedBy: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    complexity: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    startDate: v.number(),
    endDate: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_track", ["trackId"])
    .index("by_project", ["projectId"]),

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
    status: v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
    ),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_track", { fields: ["trackId"] }),


  employeeTodos:defineTable({
    employeeId:v.string(),
    title:v.string(),
    description:v.optional(v.string()),
    priority:v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    isCompleted:v.boolean(),
    createdAt:v.number(),
    updatedAt:v.optional(v.number()),

  })
  .index("by_employee",["employeeId"])
  .index("by_employee_and_status", ["employeeId", "isCompleted"]),

  meeting: defineTable({
    organizationId: v.string(),
    createdBy: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    recurrenceType: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly"),
    ),
    recurrenceDays: v.array(v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday"),
    )),
    startTime: v.number(),
    endTime: v.number(),
    meetingLink: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  meetingRecipient: defineTable({
    meetingId: v.id("meeting"),
    employeeId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  scheduleMeeting: defineTable({
    meetingId: v.id("meeting"),
    startTime: v.number(),
    endTime: v.number(),
    finalNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number())
  }),

  meetingAttendee: defineTable({
    scheduleMeetingId: v.id("scheduleMeeting"),
    employeeId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  payroll: defineTable({
    employeeId: v.string(),
    creditedAt: v.number(),
    basicSalary: v.float64(),
    deduction: v.float64(),
    overtimePay: v.float64(),
    bonus: v.float64(),
    netSalary: v.float64(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),
  
  dailyReport: defineTable({
    employeeId: v.string(),
    reportDate: v.number(),
    workSummary: v.string(),
    loginTime: v.string(),
    logoutTime: v.string(),
    reviewerId: v.string(),
    remark: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  dailyReportTaskTag: defineTable({
    reportId: v.id("dailyReport"),
    taskId: v.id("tasks"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number())
  }).index("by_reportId",["reportId"])
  .index("by_reportId_taskId",["reportId","taskId"]),

  projectMember: defineTable({
    projectId: v.id("projects"),
    employeeId: v.string(),
    manager: v.boolean(),
    assignedBy: v.string(),
    createAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_project",["projectId"])
  .index("by_project_employee",["projectId","employeeId"])
  .index("by_project_manager",["projectId","manager"])
  .index("by_employee",["employeeId"]),

  
});

