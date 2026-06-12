/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as comment from "../comment.js";
import type * as dailyReport from "../dailyReport.js";
import type * as emails from "../emails.js";
import type * as employeeProfiles from "../employeeProfiles.js";
import type * as employeeTodos from "../employeeTodos.js";
import type * as employees from "../employees.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as inbox from "../inbox.js";
import type * as label from "../label.js";
import type * as leaveRequest from "../leaveRequest.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_memberHelper from "../lib/memberHelper.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_projectActivityLog from "../lib/projectActivityLog.js";
import type * as lib_taskActivityLog from "../lib/taskActivityLog.js";
import type * as lib_taskDisplay from "../lib/taskDisplay.js";
import type * as lib_taskKanban from "../lib/taskKanban.js";
import type * as lib_taskList from "../lib/taskList.js";
import type * as meeting from "../meeting.js";
import type * as payroll from "../payroll.js";
import type * as project from "../project.js";
import type * as projectActivity from "../projectActivity.js";
import type * as projectMember from "../projectMember.js";
import type * as seed from "../seed.js";
import type * as sprint from "../sprint.js";
import type * as subtask from "../subtask.js";
import type * as syncEditor from "../syncEditor.js";
import type * as tables_attendance from "../tables/attendance.js";
import type * as tables_comments from "../tables/comments.js";
import type * as tables_dailyReport from "../tables/dailyReport.js";
import type * as tables_dailyReportTaskTag from "../tables/dailyReportTaskTag.js";
import type * as tables_employeeCertificates from "../tables/employeeCertificates.js";
import type * as tables_employeePerformancePoints from "../tables/employeePerformancePoints.js";
import type * as tables_employeeProfiles from "../tables/employeeProfiles.js";
import type * as tables_employeeTodos from "../tables/employeeTodos.js";
import type * as tables_inboxItems from "../tables/inboxItems.js";
import type * as tables_labels from "../tables/labels.js";
import type * as tables_leaveRequests from "../tables/leaveRequests.js";
import type * as tables_meeting from "../tables/meeting.js";
import type * as tables_meetingAttendee from "../tables/meetingAttendee.js";
import type * as tables_meetingRecipient from "../tables/meetingRecipient.js";
import type * as tables_payroll from "../tables/payroll.js";
import type * as tables_projectActivities from "../tables/projectActivities.js";
import type * as tables_projectMember from "../tables/projectMember.js";
import type * as tables_projects from "../tables/projects.js";
import type * as tables_scheduleMeeting from "../tables/scheduleMeeting.js";
import type * as tables_sprints from "../tables/sprints.js";
import type * as tables_subtasks from "../tables/subtasks.js";
import type * as tables_taskActivities from "../tables/taskActivities.js";
import type * as tables_taskLabels from "../tables/taskLabels.js";
import type * as tables_taskMember from "../tables/taskMember.js";
import type * as tables_tasks from "../tables/tasks.js";
import type * as tables_trackMember from "../tables/trackMember.js";
import type * as tables_tracks from "../tables/tracks.js";
import type * as task from "../task.js";
import type * as taskMember from "../taskMember.js";
import type * as track from "../track.js";
import type * as trackMember from "../trackMember.js";
import type * as userSettings from "../userSettings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  attendance: typeof attendance;
  auth: typeof auth;
  comment: typeof comment;
  dailyReport: typeof dailyReport;
  emails: typeof emails;
  employeeProfiles: typeof employeeProfiles;
  employeeTodos: typeof employeeTodos;
  employees: typeof employees;
  files: typeof files;
  http: typeof http;
  inbox: typeof inbox;
  label: typeof label;
  leaveRequest: typeof leaveRequest;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/memberHelper": typeof lib_memberHelper;
  "lib/permissions": typeof lib_permissions;
  "lib/projectActivityLog": typeof lib_projectActivityLog;
  "lib/taskActivityLog": typeof lib_taskActivityLog;
  "lib/taskDisplay": typeof lib_taskDisplay;
  "lib/taskKanban": typeof lib_taskKanban;
  "lib/taskList": typeof lib_taskList;
  meeting: typeof meeting;
  payroll: typeof payroll;
  project: typeof project;
  projectActivity: typeof projectActivity;
  projectMember: typeof projectMember;
  seed: typeof seed;
  sprint: typeof sprint;
  subtask: typeof subtask;
  syncEditor: typeof syncEditor;
  "tables/attendance": typeof tables_attendance;
  "tables/comments": typeof tables_comments;
  "tables/dailyReport": typeof tables_dailyReport;
  "tables/dailyReportTaskTag": typeof tables_dailyReportTaskTag;
  "tables/employeeCertificates": typeof tables_employeeCertificates;
  "tables/employeePerformancePoints": typeof tables_employeePerformancePoints;
  "tables/employeeProfiles": typeof tables_employeeProfiles;
  "tables/employeeTodos": typeof tables_employeeTodos;
  "tables/inboxItems": typeof tables_inboxItems;
  "tables/labels": typeof tables_labels;
  "tables/leaveRequests": typeof tables_leaveRequests;
  "tables/meeting": typeof tables_meeting;
  "tables/meetingAttendee": typeof tables_meetingAttendee;
  "tables/meetingRecipient": typeof tables_meetingRecipient;
  "tables/payroll": typeof tables_payroll;
  "tables/projectActivities": typeof tables_projectActivities;
  "tables/projectMember": typeof tables_projectMember;
  "tables/projects": typeof tables_projects;
  "tables/scheduleMeeting": typeof tables_scheduleMeeting;
  "tables/sprints": typeof tables_sprints;
  "tables/subtasks": typeof tables_subtasks;
  "tables/taskActivities": typeof tables_taskActivities;
  "tables/taskLabels": typeof tables_taskLabels;
  "tables/taskMember": typeof tables_taskMember;
  "tables/tasks": typeof tables_tasks;
  "tables/trackMember": typeof tables_trackMember;
  "tables/tracks": typeof tables_tracks;
  task: typeof task;
  taskMember: typeof taskMember;
  track: typeof track;
  trackMember: typeof trackMember;
  userSettings: typeof userSettings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  prosemirrorSync: import("@convex-dev/prosemirror-sync/_generated/component.js").ComponentApi<"prosemirrorSync">;
};
