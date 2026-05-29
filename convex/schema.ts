/**
 * NOTE:
 * In this file define first validators seperately for each type of data.
 * Then use them in the schema definitions.
 *
 * So later we can reuse them in other files for validation and mutations.
 */
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { projectColorValidator } from './lib/projectAppearance'

/*********************************************
 * EMPLOYEE PROFILE VALIDATORS
 ********************************************/
export const onboardingStatusValidator = v.union(
  v.literal('pending'),
  v.literal('completed'),
)

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
  profilePhotoStorageId: v.optional(v.id('_storage')),
})

export const EmployeeTodoPriorityValidator = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
)
export const EmployeeTodosValidator = v.object({
  employeeId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  priority: EmployeeTodoPriorityValidator,
  isCompleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

export const EmployeeCertificatesValidator = v.object({
  employeeProfileId: v.id('employeeProfiles'),
  organizationId: v.string(),
  storageId: v.id('_storage'),
  fileName: v.string(),
  contentType: v.string(),
})

/*********************************************
 * Project VALIDATORS
 ********************************************/
export const ProjectStatusValidator = v.union(
  v.literal('active'),
  v.literal('inactive'),
  v.literal('terminated'),
)

export const ProjectKindValidator = v.union(
  v.literal('created'),
  v.literal('name_changed'),
  v.literal('summary_changed'),
  v.literal('status_changed'),
  v.literal('start_date_changed'),
  v.literal('end_date_changed'),
  v.literal('icon_changed'),
  v.literal('color_changed'),
)

export const ProjectValidator = v.object({
  organizationId: v.string(),
  name: v.string(),
  summary: v.optional(v.string()),
  description: v.optional(v.any()),
  icon: v.optional(v.string()),
  color: v.optional(projectColorValidator),
  startDate: v.number(),
  endDate: v.number(),
  status: ProjectStatusValidator,
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

export const ProjectActivityValidator = v.object({
  projectId: v.id('projects'),
  organizationId: v.string(),
  actorUserId: v.string(),
  actorName: v.string(),
  kind: ProjectKindValidator,
  fromValue: v.optional(v.string()),
  toValue: v.optional(v.string()),
  createdAt: v.number(),
})

export const ProjectMemberValidator = v.object({
  projectId: v.id('projects'),
  employeeId: v.string(),
  manager: v.boolean(),
  assignedBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
/*********************************************
 * TRACK VALIDATOR
 *********************************************/
export const TrackStatusValidator = v.union(
  v.literal('active'),
  v.literal('completed'),
  v.literal('archived'),
)

export const TrackValidator = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  projectId: v.id('projects'),
  trackCode: v.string(),
  trackLeaderID: v.string(),
  status: TrackStatusValidator,
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

/*********************************************
 * TASK VALIDATORS
 ********************************************/
export const TaskStatusValidator = v.union(
  v.literal('backlog'),
  v.literal('todo'),
  v.literal('in_progress'),
  v.literal('done'),
)

export const TaskPriorityValidator = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('critical'),
)

export const TaskComplexityValidator = v.union(
  v.literal('easy'),
  v.literal('medium'),
  v.literal('hard'),
)

export const TaskValidator = v.object({
  trackId: v.id('tracks'),
  projectId: v.id('projects'),
  sprintId: v.optional(v.id('sprints')),
  taskCode: v.string(),
  title: v.string(),
  description: v.optional(v.any()),
  status: TaskStatusValidator,
  createdBy: v.string(),
  priority: TaskPriorityValidator,
  complexity: TaskComplexityValidator,
  dueDate: v.optional(v.union(v.number(), v.null())),
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})

export const TaskActivityValidator = v.object({
  taskId: v.id('tasks'),
  actorName: v.string(),
  actorUserId: v.optional(v.string()),
  kind: v.union(
    v.literal('created'),
    v.literal('title_changed'),
    v.literal('status_changed'),
    v.literal('priority_changed'),
    v.literal('due_date_changed'),
    v.literal('label_added'),
    v.literal('label_removed'),
  ),
  fromValue: v.optional(v.string()),
  toValue: v.optional(v.string()),
  meta: v.optional(v.string()),
  createdAt: v.optional(v.number()),
})

/**************************************
 * Sprint Validators
 **************************************/
export const SprintStatusValidator = v.union(
  v.literal('planned'),
  v.literal('active'),
  v.literal('completed'),
)

export const SprintValidator = v.object({
  trackId: v.id('tracks'),
  sprintName: v.string(),
  goal: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  status: SprintStatusValidator,
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

/*************************************
 * Inbox Validators
 *************************************/

export const InboxKindValidator = v.union(
  v.literal('assignment'),
  v.literal('comment'),
  v.literal('invite'),
  v.literal('system'),
  v.literal('onboarding'),
)

export const InboxValidator = v.object({
  organizationId: v.string(),
  recipientUserId: v.string(),
  kind: InboxKindValidator,
  title: v.string(),
  snippet: v.optional(v.string()),
  body: v.optional(v.string()),
  read: v.boolean(),
  archived: v.boolean(),
  actorName: v.optional(v.string()),
})

/*************************************
 * Attendance Validators
 *************************************/

export const AttendanceStatusValidator = v.union(
  v.literal('present'),
  v.literal('on leave'),
  v.literal('late'),
  v.literal('half day'),
)

export const AttendanceValidator = v.object({
  employeeId: v.string(),
  recordDate: v.number(),
  loginTime: v.number(),
  logoutTime: v.optional(v.number()),
  status: AttendanceStatusValidator,
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

/*****************************************
 * Payroll Validators
 *****************************************/

export const PayrollValidator = v.object({
  employeeId: v.string(),
  creditedAt: v.number(),
  basicSalary: v.float64(),
  deduction: v.float64(),
  overtimePay: v.float64(),
  bonus: v.float64(),
  netSalary: v.float64(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

/***************************************
 * DailyReport Validator
 */

export const DailyReportValidator = v.object({
  employeeId: v.string(),
  reportDate: v.number(),
  workSummary: v.string(),
  loginTime: v.string(),
  logoutTime: v.string(),
  reviewerId: v.string(),
  remark: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

export const DailyReportTaskTagValidator = v.object({
  reportId: v.id('dailyReport'),
  taskId: v.id('tasks'),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

/********************************************
 * Leave Request Validator
 ********************************************/

export const LeaveRequestTypeValidator = v.union(
  v.literal('sick'),
  v.literal('casual'),
  v.literal('emergency'),
)

export const LeaveRequestStatusValidator = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected'),
)

export const LeaveRequestValidator = v.object({
  employeeId: v.string(),
  leaveType: LeaveRequestTypeValidator,
  startDate: v.number(),
  endDate: v.number(),
  reason: v.string(),
  status: LeaveRequestStatusValidator,
  approvedBy: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

/**************************************
 * Meeting Validators
 **************************************/

export const MeetingRecurenceDaysValidator = v.array(
  v.union(
    v.literal('monday'),
    v.literal('tuesday'),
    v.literal('wednesday'),
    v.literal('thursday'),
    v.literal('friday'),
    v.literal('saturday'),
    v.literal('sunday'),
  ),
)

export const MeetingRecurrenceTypeValidator = v.union(
  v.literal('none'),
  v.literal('daily'),
  v.literal('weekly'),
)

export const MeetingValidator = v.object({
  organizationId: v.string(),
  createdBy: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  recurrenceType: MeetingRecurrenceTypeValidator,
  recurrenceDays: MeetingRecurenceDaysValidator,
  startTime: v.number(),
  endTime: v.number(),
  meetingLink: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

export const MeetingRecipientValidator = v.object({
  meetingId: v.id('meeting'),
  employeeId: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

export const ScheduleMeetingValidator = v.object({
  meetingId: v.id('meeting'),
  startTime: v.number(),
  endTime: v.number(),
  finalNotes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

export const MeetingAttendanceValidator = v.object({
  scheduleMeetingId: v.id('scheduleMeeting'),
  employeeId: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})

/********************************************
 * Comment Validators
 ********************************************/

export const CommentValidator = v.object({
  taskId: v.id('tasks'),
  // `null` for top-level (root of a thread), otherwise the parent comment's id
  parentCommentId: v.union(v.id('comments'), v.null()),
  deviceName: v.string(),
  body: v.any(),
  editedAt: v.optional(v.number()),
  // When true, marks this comment as the resolution of its thread
  isResolution: v.optional(v.boolean()),
})

/*
===========================================
              MAIN SCHEMA
===========================================

Use the validators defined above to define the schema.

@example:

tasks: defineTable(TaskValidator)
  .index("by_track", ["trackId"])
  .index("by_project", ["projectId"])
  .index("by_sprint", ["sprintId"]),
*/

export default defineSchema({
  inboxItems: defineTable(InboxValidator)
    .index('by_org_recipient_archived', [
      'organizationId',
      'recipientUserId',
      'archived',
    ])
    .index('by_org_recipient_archived_read', [
      'organizationId',
      'recipientUserId',
      'archived',
      'read',
    ]),

  employeeProfiles: defineTable(employeeProfileSchema).index('by_employee', [
    'employeeId',
  ]),

  employeeCertificates: defineTable(EmployeeCertificatesValidator).index(
    'by_profile',
    ['employeeProfileId'],
  ),

  projects: defineTable(ProjectValidator).index('by_organization', [
    'organizationId',
  ]),

  projectActivities: defineTable(ProjectActivityValidator)
    .index('by_project', ['projectId'])
    .index('by_project_actor', ['projectId', 'actorUserId']),

  tracks: defineTable(TrackValidator).index('by_project', {
    fields: ['projectId'],
  }),

  employeePerformancePoints: defineTable({
    employeeId: v.id('employee'),
    taskId: v.id('tasks'),
    points: v.number(),
    awardedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_employee', ['employeeId'])
    .index('by_task', ['taskId']),

  attendance: defineTable(AttendanceValidator)
    .index('by_employee_and_date', ['employeeId', 'recordDate'])
    .index('by_employee', ['employeeId']),

  leaveRequests: defineTable(LeaveRequestValidator)
    .index('by_employee', ['employeeId'])
    .index('by_status', ['status'])
    .index('by_approved_by', ['approvedBy']),

  tasks: defineTable(TaskValidator)
    .index('by_track', ['trackId'])
    .index('by_project', ['projectId'])
    .index('by_sprint', ['sprintId']),

  labels: defineTable({
    name: v.string(),
    color: v.string(),
    projectId: v.id('projects'),
  }).index('by_project', { fields: ['projectId'] }),

  taskLabels: defineTable({
    taskId: v.id('tasks'),
    labelId: v.id('labels'),
  })
    .index('by_task', { fields: ['taskId'] })
    .index('by_label', { fields: ['labelId'] }),

  subtasks: defineTable({
    taskId: v.id('tasks'),
    title: v.string(),
    completed: v.boolean(),
    order: v.number(),
  }).index('by_task_and_order', { fields: ['taskId', 'order'] }),

  taskActivities: defineTable(TaskActivityValidator).index('by_task', {
    fields: ['taskId'],
  }),

  comments: defineTable(CommentValidator).index('by_task', {
    fields: ['taskId'],
  }),

  sprints: defineTable(SprintValidator).index('by_track', {
    fields: ['trackId'],
  }),

  employeeTodos: defineTable(EmployeeTodosValidator)
    .index('by_employee', ['employeeId'])
    .index('by_employee_and_status', ['employeeId', 'isCompleted']),

  meeting: defineTable(MeetingValidator).index('by_organization', [
    'organizationId',
  ]),

  meetingRecipient: defineTable(MeetingRecipientValidator).index('by_meeting', [
    'meetingId',
  ]),

  scheduleMeeting: defineTable(ScheduleMeetingValidator).index('by_meeting', [
    'meetingId',
  ]),

  meetingAttendee: defineTable(MeetingAttendanceValidator).index(
    'by_schedule',
    ['scheduleMeetingId'],
  ),

  payroll: defineTable(PayrollValidator)
    .index('by_employee', ['employeeId'])
    .index('by_credited_at', ['creditedAt']),

  dailyReport: defineTable(DailyReportValidator),

  dailyReportTaskTag: defineTable(DailyReportTaskTagValidator)
    .index('by_reportId', ['reportId'])
    .index('by_reportId_taskId', ['reportId', 'taskId']),

  projectMember: defineTable(ProjectMemberValidator)
    .index('by_project', ['projectId'])
    .index('by_project_employee', ['projectId', 'employeeId'])
    .index('by_project_manager', ['projectId', 'manager'])
    .index('by_employee', ['employeeId']),

  trackMember: defineTable({
    trackId: v.id('tracks'),
    employeeId: v.string(),
    lead: v.boolean(),
    assignedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_track_employee', ['trackId', 'employeeId'])
    .index('by_track', ['trackId'])
    .index('by_employee', ['employeeId']),

  taskMember: defineTable({
    taskId: v.id('tasks'),
    employeeId: v.string(),
    lead: v.boolean(),
    assignedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_task', ['taskId'])
    .index('by_task_employee', ['taskId', 'employeeId']),
})
