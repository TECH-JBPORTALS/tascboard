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
import type * as comment from "../comment.js";
import type * as emails from "../emails.js";
import type * as employeeProfiles from "../employeeProfiles.js";
import type * as employeeTodos from "../employeeTodos.js";
import type * as employees_auth from "../employees/auth.js";
import type * as employees_profile from "../employees/profile.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as inbox from "../inbox.js";
import type * as label from "../label.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_betterAuthAdapter from "../lib/betterAuthAdapter.js";
import type * as lib_employees from "../lib/employees.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_projectActivityLog from "../lib/projectActivityLog.js";
import type * as lib_projectAppearance from "../lib/projectAppearance.js";
import type * as meeting from "../meeting.js";
import type * as payroll from "../payroll.js";
import type * as project from "../project.js";
import type * as projectActivity from "../projectActivity.js";
import type * as projectMember from "../projectMember.js";
import type * as sprint from "../sprint.js";
import type * as subtask from "../subtask.js";
import type * as task from "../task.js";
import type * as track from "../track.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  attendance: typeof attendance;
  comment: typeof comment;
  emails: typeof emails;
  employeeProfiles: typeof employeeProfiles;
  employeeTodos: typeof employeeTodos;
  "employees/auth": typeof employees_auth;
  "employees/profile": typeof employees_profile;
  files: typeof files;
  http: typeof http;
  inbox: typeof inbox;
  label: typeof label;
  "lib/auth": typeof lib_auth;
  "lib/betterAuthAdapter": typeof lib_betterAuthAdapter;
  "lib/employees": typeof lib_employees;
  "lib/permissions": typeof lib_permissions;
  "lib/projectActivityLog": typeof lib_projectActivityLog;
  "lib/projectAppearance": typeof lib_projectAppearance;
  meeting: typeof meeting;
  payroll: typeof payroll;
  project: typeof project;
  projectActivity: typeof projectActivity;
  projectMember: typeof projectMember;
  sprint: typeof sprint;
  subtask: typeof subtask;
  task: typeof task;
  track: typeof track;
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
};
