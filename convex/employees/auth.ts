/**
 * Better Auth employee & invitation entities (`employee`, `invitation`, `user`, `organization` models).
 * Uses the betterAuth component adapter — keep profile/certificate logic in `employeeProfiles.ts`.
 */
import { internalMutation, query } from "../_generated/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import {
  requireIdentity,
  requireOrganization,
  requirePermission,
} from "../lib/auth";
import { getEmployeeForUser } from "../lib/employees";
import {
  getAdapterPage,
  type EmployeeRecord,
  type InvitationRecord,
} from "../lib/betterAuthAdapter";

const employeeListItem = v.object({
  id: v.string(),
  userId: v.string(),
  role: v.string(),
  createdAt: v.number(),
  name: v.string(),
  email: v.string(),
  image: v.union(v.string(), v.null()),
  active: v.boolean(),
});

const invitationListItem = v.object({
  id: v.string(),
  email: v.string(),
  role: v.union(v.string(), v.null()),
  status: v.string(),
  expiresAt: v.number(),
});

const invitationPreview = v.object({
  status: v.string(),
  email: v.string(),
  organizationId: v.string(),
  organizationName: v.string(),
  organizationSlug: v.string(),
  organizationLogo: v.union(v.string(), v.null()),
  expiresAt: v.number(),
  role: v.union(v.string(), v.null()),
});

export const getInvitationPreview = query({
  args: { invitationId: v.string() },
  returns: v.union(invitationPreview, v.null()),
  handler: async (ctx, args) => {
    const invitation = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "invitation",
        where: [{ field: "_id", operator: "eq", value: args.invitationId }],
      },
    );

    if (!invitation) return null;

    const inv = invitation as InvitationRecord;

    const organization = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "organization",
        where: [{ field: "_id", operator: "eq", value: inv.organizationId }],
      },
    );

    if (!organization) return null;

    const org = organization as {
      name: string;
      slug: string;
      logo?: string | null;
    };

    return {
      status: inv.status,
      email: inv.email,
      organizationId: inv.organizationId,
      organizationName: org.name,
      organizationSlug: org.slug,
      organizationLogo: org.logo ?? null,
      expiresAt: inv.expiresAt,
      role: inv.role ?? null,
    };
  },
});

/** Called from Better Auth hooks when an invitation is cancelled. */
export const deleteInvitationRecord = internalMutation({
  args: { invitationId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "invitation",
        where: [{ field: "_id", operator: "eq", value: args.invitationId }],
      },
    });
    return null;
  },
});

export const list = query({
  args: {},
  returns: v.array(employeeListItem),
  handler: async (ctx) => {
    await requirePermission(ctx, { employee: ["list"] });
    const { orgId } = await requireOrganization(ctx);

    const employeesResult = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "employee",
        where: [{ field: "organizationId", operator: "eq", value: orgId }],
        paginationOpts: { numItems: 200, cursor: null },
      },
    );

    const employeeList = getAdapterPage(employeesResult) as EmployeeRecord[];
    const result = [];

    for (const employee of employeeList) {
      const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user",
        where: [{ field: "_id", operator: "eq", value: employee.userId }],
      });

      const u = user as {
        name: string;
        email: string;
        image?: string | null;
      } | null;

      result.push({
        id: employee._id,
        userId: employee.userId,
        role: employee.role,
        createdAt: employee.createdAt,
        name: u?.name ?? "Unknown",
        email: u?.email ?? "",
        image: u?.image ?? null,
        active: employee.active,
      });
    }

    return result;
  },
});

export const listPendingInvitations = query({
  args: {},
  returns: v.array(invitationListItem),
  handler: async (ctx) => {
    await requirePermission(ctx, { employee: ["list"] });
    const { orgId } = await requireOrganization(ctx);

    const invitationsResult = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "invitation",
        where: [
          { field: "organizationId", operator: "eq", value: orgId },
          { field: "status", operator: "eq", value: "pending" },
        ],
        paginationOpts: { numItems: 100, cursor: null },
      },
    );

    const list = getAdapterPage(invitationsResult) as InvitationRecord[];

    return list.map((inv) => ({
      id: inv._id,
      email: inv.email,
      role: inv.role ?? null,
      status: inv.status,
      expiresAt: inv.expiresAt,
    }));
  },
});

export const getRole = query({
  args: { organizationId: v.optional(v.string()) },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const orgId = args.organizationId ?? identity.orgId;
    if (!orgId) return null;

    const employee = await getEmployeeForUser(ctx, orgId, identity.userId);
    return employee?.role ?? null;
  },
});
