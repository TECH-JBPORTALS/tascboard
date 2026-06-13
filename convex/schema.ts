import { defineSchema } from 'convex/server'
import { typedV } from 'convex-helpers/validators'
import { attendance } from './tables/attendance'
import { comments } from './tables/comments'
import { dailyReport } from './tables/dailyReport'
import { dailyReportTaskTag } from './tables/dailyReportTaskTag'
import { employeeCertificates } from './tables/employeeCertificates'
import { employeePerformancePoints } from './tables/employeePerformancePoints'
import { employeeProfiles } from './tables/employeeProfiles'
import { employeeTodos } from './tables/employeeTodos'
import { inboxItems } from './tables/inboxItems'
import { labels } from './tables/labels'
import { leaveRequests } from './tables/leaveRequests'
import { meeting } from './tables/meeting'
import { meetingAttendee } from './tables/meetingAttendee'
import { meetingRecipient } from './tables/meetingRecipient'
import { organizationWorkSchedule } from './tables/organizationWorkSchedule'
import { payroll } from './tables/payroll'
import { projectActivities } from './tables/projectActivities'
import { projectMember } from './tables/projectMember'
import { projects } from './tables/projects'
import { scheduleMeeting } from './tables/scheduleMeeting'
import { sprints } from './tables/sprints'
import { subtasks } from './tables/subtasks'
import { taskActivities } from './tables/taskActivities'
import { taskLabels } from './tables/taskLabels'
import { taskMember } from './tables/taskMember'
import { tasks } from './tables/tasks'
import { trackMember } from './tables/trackMember'
import { tracks } from './tables/tracks'

const schema = defineSchema({
  inboxItems,
  employeeProfiles,
  employeeCertificates,
  projects,
  projectActivities,
  tracks,
  employeePerformancePoints,
  attendance,
  leaveRequests,
  tasks,
  labels,
  taskLabels,
  subtasks,
  taskActivities,
  comments,
  sprints,
  employeeTodos,
  meeting,
  meetingRecipient,
  scheduleMeeting,
  meetingAttendee,
  payroll,
  dailyReport,
  dailyReportTaskTag,
  projectMember,
  trackMember,
  taskMember,
  organizationWorkSchedule,
})

export const vv = typedV(schema)
export default schema
