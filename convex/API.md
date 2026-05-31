# Convex API reference

Public functions are called from the client as `api.<file>.<exportName>`. Types come from `convex/_generated/api`.

```ts
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

const tasks = useQuery(api.task.list, { trackId })
const create = useMutation(api.task.create)
```

## Auth levels

| Tag | Builder | Requirement |
|-----|---------|-------------|
| **Private** | `privateQuery` / `privateMutation` | Signed-in user |
| **Org** | `organizationQuery` / `organizationMutation` | Signed-in user + active organization |
| **Public** | `query` / `mutation` | No custom wrapper (rare) |
| **Internal** | `internal*` | Server-only; use `internal.*` |

`employeeId` in args is the Better Auth **member** id (`ctx.session.employee.id` in org context).

Patch/update mutations often use `{ …Id, body: { …partial fields } }`.

---

## Auth (`api.auth`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `listOrganizations` | query | — | Better Auth org list | No custom wrapper |
| `getActiveOrganization` | query | — | Full active org | No custom wrapper |
| `getActiveMemberRole` | query | — | `{ role }` \| `null` | No custom wrapper |

---

## Employees (`api.employees`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `list` | Org query | — | Members from Better Auth | |
| `listInvitations` | Org query | — | Pending invitations | Component query |
| `getEmployeeDetails` | Org query | `employeeId: string` | Member + profile \| `null` | |
| `getInvitationById` | **Public** query | `invitationId: string` | Invitation + user | Unauthenticated-friendly |

---

## Employee profiles (`api.employeeProfiles`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `getMyOnboardingStatus` | Org query | — | Onboarding state \| `null` | |
| `getMyProfile` | Org query | — | Profile + certificates \| `null` | |
| `saveGeneralInfo` | Org mutation | `firstName`, `lastName`, `dateOfBirth`, `address`, `profilePhotoStorageId?` | `null` | |
| `saveGovernmentId` | Org mutation | `aadharNumber`, `panNumber` | `null` | |
| `saveBankDetails` | Org mutation | Bank fields | `null` | |
| `addCertificate` | Org mutation | `storageId`, `fileName`, `contentType` | `Id<employeeCertificates>` | |
| `removeCertificate` | Org mutation | `certificateId` | `null` | |
| `completeOnboarding` | Org mutation | — | `null` | |

**Internal:** `getInternalEmployeeProfile`, `ensureProfileAfterInvite` (Better Auth hooks).

---

## Employee todos (`api.employeeTodos`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `list` | Private query | `employeeId` | `employeeTodos[]` | |
| `get` | Private query | `todoId` | Doc \| `null` | |
| `create` | Private mutation | `employeeId`, `title`, `description?`, `priority` | `Id` | `priority`: low \| medium \| high |
| `update` | Private mutation | `todoId`, `body` (partial title, description, priority, isCompleted) | `null` | |
| `remove` | Private mutation | `todoId` | `null` | |

---

## Files (`api.files`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `generateUploadUrl` | Private mutation | — | Upload URL string | Convex storage |
| `getUrl` | Private query | `storageId` | URL \| `null` | |

---

## Inbox (`api.inbox`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `list` | Org query | `filter`: `inbox` \| `archive` | Inbox items | |
| `get` | Private query | `id` | Item \| `null` | |
| `getOnboardingInboxItemId` | Org query | — | `Id` \| `null` | |
| `unreadCount` | Org query | — | `number` | |
| `archiveCount` | Org query | — | `number` | |
| `listArchived` | Org query | — | Archived items | |
| `markRead` | Private mutation | `itemId` | `null` | |
| `markUnread` | Private mutation | `itemId` | `null` | |
| `archive` | Private mutation | `itemId` | `null` | |
| `unarchive` | Private mutation | `itemId` | `null` | |
| `permanentlyDelete` | Private mutation | `itemId` | `null` | |
| `deleteAllArchived` | Org mutation | — | Deleted count | |
| `markAllRead` | Org mutation | — | `null` | |
| `seedWelcomeItems` | Org mutation | — | `null` | Dev/seed |

**Internal:** `createInboxItem`.

---

## Projects (`api.project`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `create` | Org mutation | Project fields (no org id / description / timestamps) | `Id<projects>` | Creates ProseMirror editor |
| `list` | Org query | — | Projects + nested tracks | Current org only |
| `get` | Private query | `projectId` | Project + description + members \| `null` | Org check |
| `update` | Org mutation | `projectId`, `body` (partial project fields) | `Id` | Logs activity |
| `updateDescription` | Org mutation | `projectId`, `description` (ProseMirror JSON) | `null` | |
| `remove` | Org mutation | `projectId` | Cascade summary object | Deletes tracks/tasks |
| `seedStarterProjects` | Org mutation | — | `null` | Onboarding seed |

---

## Project activity (`api.projectActivity`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `list` | Org query | `projectId` | Activity rows | |
| `topPerformers` | Org query | `projectId` | Performance leaderboard | Uses `employeePerformancePoints` |

---

## Project members (`api.projectMember`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `toggleMember` | Private mutation | `projectId`, `employeeId` | `null` | Add/remove member |
| `setManager` | Private mutation | `projectId`, `employeeId` | `null` | |
| `removeManager` | Private mutation | `projectId`, `employeeId` | `null` | |
| `list` | Private query | `projectId` | Members with profiles | |

---

## Tracks (`api.track`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `create` | Org mutation | Track fields (no timestamps) | `Id<tracks>` | Project must be in org |
| `listByProject` | Private query | `projectId` | Tracks[] | Org check |
| `get` | Private query | `trackId` | Track + members + lead | |
| `update` | Private mutation | `trackId`, `body` (partial, no projectId) | `null` | |
| `remove` | Private mutation | `trackId` | `null` | Cascades tasks |

---

## Track members (`api.trackMember`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `toggleMember` | Private mutation | `trackId`, `employeeId` | `null` | |
| `setLead` | Private mutation | `trackId`, `employeeId` | `null` | |
| `unsetLead` | Private mutation | `trackId`, `employeeId` | `null` | |
| `list` | Private query | `trackId` | Members | |

---

## Tasks (`api.task`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `create` | Private mutation | Task fields (no taskCode, timestamps, createdBy, statusOrder, started/completed) | `Id<tasks>` | Auto taskCode, statusOrder |
| `get` | Private query | `taskId` | Task + track, project, labels, members | |
| `listByTrack` | Private query | `trackId` | Tasks sorted for kanban | |
| `list` | Private query | `trackId`, optional filters: `sprintId`, `statuses[]`, `assigneeIds[]`, `labelIds[]`, `noDueDate`, `dueFrom`, `dueTo` | Filtered task list | |
| `listTaskEmployees` | Private query | `trackId` | Deduplicated assignees | |
| `reorderKanban` | Private mutation | `taskId`, `status`, `statusOrder` | `null` | Column reorder |
| `update` | Private mutation | `taskId`, `body` (partial task fields) | `null` | Activity log |
| `remove` | Private mutation | `taskId` | `null` | Cascade subtasks, etc. |

**Task `status`:** `backlog` \| `todo` \| `in_progress` \| `done`  
**Task `priority`:** `low` \| `medium` \| `high` \| `critical`

---

## Task members (`api.taskMember`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `toggleMember` | Private mutation | `taskId`, `employeeId` | `null` | |
| `setLead` | Private mutation | `taskId`, `employeeId` | `null` | |
| `unsetLead` | Private mutation | `taskId`, `employeeId` | `null` | |
| `list` | Private query | `taskId` | Members | |

---

## Task activity (`api.activity`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `listByTask` | Private query | `taskId`, `limit?` (max 100, default 50) | Activity rows (desc) | |

---

## Subtasks (`api.subtask`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `listByTask` | Private query | `taskId` | Subtasks | |
| `create` | Private mutation | `taskId`, `title`, `deviceName` | `Id<subtasks>` | |
| `toggle` | Private mutation | `subtaskId` | `null` | Flips `completed` |
| `rename` | Private mutation | `subtaskId`, `title` | `null` | |
| `remove` | Private mutation | `subtaskId` | `null` | |

---

## Comments (`api.comment`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `listByTask` | Private query | `taskId` | Comments (asc by time) | |
| `create` | Private mutation | `taskId`, `parentCommentId` (id \| null), `deviceName`, `body` | Comment id | One-level threading |
| `edit` | Private mutation | `commentId`, `body` | `null` | |
| `remove` | Private mutation | `commentId` | `null` | |
| `toggleResolution` | Private mutation | `commentId` | `null` | Thread resolution flag |

---

## Labels (`api.label`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `listByProject` | Private query | `projectId` | Labels | |
| `listTaskLabels` | Private query | `taskId` | Labels on task | |
| `create` | Private mutation | `projectId`, `name`, `color` | `Id<labels>` | |
| `get` | Private query | `labelId` | Label \| `null` | |
| `update` | Private mutation | `labelId`, `name?`, `color?` | `null` | |
| `remove` | Private mutation | `labelId` | `null` | |
| `attachToTask` | Private mutation | `taskId`, `labelId` | `Id<taskLabels>` \| `null` | Logs activity |
| `detachFromTask` | Private mutation | `taskId`, `labelId` | `null` | |

---

## Sprints (`api.sprint`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `create` | Private mutation | `trackId`, `goal`, `startDate`, `endDate`, `status?` | `Id<sprints>` | Auto `sprintNumber` |
| `listByTrack` | Private query | `trackId`, `status?` | Sprints + task stats | |
| `addTask` | Private mutation | `taskId`, `sprintId` | `{ success, message }` | |
| `listTasksBySprint` | Private query | `sprintId` | Tasks | |
| `edit` | Private mutation | `sprintId`, `status`, `startDate`, `endDate`, `goal` | `null` | |
| `remove` | Private mutation | `sprintId` | `null` | |
| `backlog` | Private query | `trackId` | Tasks without sprint | |
| `progress` | Private query | `sprintId` | Progress stats | |
| `burndownChart` | Private query | `sprintId` | Chart data points | |

**Sprint `status`:** `planned` \| `active` \| `completed`

---

## Meetings (`api.meeting`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `create` | Org mutation | Meeting fields + `recipients: string[]` (employee ids) | `Id<meeting>` | |
| `update` | Org mutation | `meetingId`, `body` (partial meeting) | `null` | |
| `list` | Org query | — | Org meetings | |
| `get` | Org query | `meetingId` | Meeting \| `null` | |
| `remove` | Org mutation | `meetingId` | `null` | |
| `scheduleMeeting` | Private mutation | `meetingId`, `startTime`, `endTime`, `finalNotes?` | `Id<scheduleMeeting>` | |
| `inviteAttendees` | Private mutation | `scheduleMeetingId`, `employeeIds[]` | `null` | Inserts attendees |
| `recordMeetingNotes` | Private mutation | `scheduleMeetingId`, `finalNotes` | `null` | |
| `trackMeetingAttendance` | Private query | `scheduleMeetingId` | Attendee rows | |
| `getRecipients` | Private query | `meetingId` | Recipients | |
| `getSchedules` | Private query | `meetingId` | Scheduled instances | |

**Internal:** `sendMeetingReminders`.

---

## Attendance (`api.attendance`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `createAttendance` | Private mutation | Attendance fields (no timestamps) | `Id<attendance>` | One per employee/date |
| `listByEmployee` | Private query | `employeeId` | Records (desc) | |
| `getAttendanceByDate` | Private query | `employeeId`, `recordDate` | Record \| `null` | |
| `updateAttendance` | Private mutation | `attendanceId`, `body` (login/logout/status) | `null` | |
| `deleteAttendance` | Private mutation | `attendanceId` | `null` | |
| `markLogout` | Private mutation | `attendanceId`, `logoutTime` | `null` | |
| `listTodayAttendance` | Private query | `startOfDay`, `endOfDay` | Records in range | |

**Status:** `present` \| `on leave` \| `late` \| `half day`

---

## Leave requests (`api.leaveRequest`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `raise` | Private mutation | `employeeId`, `leaveType`, `startDate`, `endDate`, `reason` | `{ success, requestId, remainingLeavesAfterApproval }` | Quota check |
| `update` | Private mutation | `leaveRequestId`, `body` (partial) | `null` | |
| `get` | Private query | `leaveRequestId` | Request \| `null` | |
| `list` | Private query | `employeeId?` | Requests | |
| `remove` | Private mutation | `leaveRequestId` | `null` | |
| `getLeaveBalance` | Private query | `employeeId` | Balance info | |
| `getStats` | Private query | — | Aggregate stats | |

**Leave type:** `sick` \| `casual` \| `emergency`  
**Status:** `pending` \| `approved` \| `rejected`

---

## Payroll (`api.payroll`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `list` | Private query | `employeeId` | Payroll rows | |
| `listAll` | Private query | `from?`, `to?` (timestamps) | All rows in range | |
| `get` | Private query | `id` | Row \| `null` | |
| `update` | Private mutation | `id`, optional salary fields | `null` | |
| `remove` | Private mutation | `id` | `null` | |
| `getSummary` | Private query | `employeeId` | Totals / summary | |

**Internal:** `create` (insert payroll).

---

## Daily reports (`api.dailyReport`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `create` | Org mutation | Report fields (no timestamps) | `Id<dailyReport>` | |
| `list` | Org query | — | All reports | |
| `get` | Org query | `reportId` | Report \| `null` | |
| `update` | Org mutation | `reportId`, `body` (partial, no employeeId) | `null` | |
| `remove` | Org mutation | `reportId` | `null` | Deletes tags |
| `createTaskTag` | Private mutation | `reportId`, `taskId` | `Id<dailyReportTaskTag>` | |
| `listTaskTags` | Private query | `reportId` | Tags | |
| `updateTaskTag` | Private mutation | `tagId`, `taskId?`, `reportId?` | `null` | |
| `removeTaskTag` | Private mutation | `tagId` | `null` | |

**Internal / seed:** `seedDailyReports`.

---

## Project editor sync (`api.syncEditor`)

ProseMirror collaborative editing for project descriptions. Editor id format: `project-<projectId>`.

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `getSnapshot` | mutation/query API | Per `@convex-dev/prosemirror-sync` | Document snapshot | Org write check |
| `submitSnapshot` | sync API | — | — | |
| `latestVersion` | sync API | — | — | |
| `getSteps` | sync API | — | — | |
| `submitSteps` | sync API | — | — | |

**Internal:** `createEditor` (`id`, `content`).

---

## Internal functions (server-only)

Call via `internal.<module>.<name>` from Convex functions, not from React.

| Module | Exports | Purpose |
|--------|---------|---------|
| `inbox` | `createInboxItem` | System notifications |
| `payroll` | `create` | Insert payroll row |
| `employeeProfiles` | `getInternalEmployeeProfile`, `ensureProfileAfterInvite` | Auth hooks |
| `meeting` | `sendMeetingReminders` | Reminders |
| `emails` | `sendInvitationEmail`, `processInvitationEmail`, … | Resend |
| `syncEditor` | `createEditor` | New project editor doc |
| `taskKanbanMigration` | `backfillTaskStatusOrder` | One-off migration |

## Better Auth component

Component APIs live under `components.betterAuth.*` (e.g. `invitations.listPendingInvitations`, `employees.getByOrganizationUser`). See `convex/betterAuth/`.

---

## Related docs

- [README.md](./README.md) — How to add functions, `vv`, and custom builders
- [tables/](./tables/) — Schema source of truth per table
