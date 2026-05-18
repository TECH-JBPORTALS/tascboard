import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  getOrganizationContext,
  requireIdentity,
  requireMembership,
  requireOrganization,
  requirePermission,
} from "./lib/auth";
import { getMemberForUser } from "./lib/members";

const MAX_CERTIFICATES = 5;

function getAdapterPage(result: unknown): unknown[] {
  if (
    result &&
    typeof result === "object" &&
    "page" in result &&
    Array.isArray((result as { page: unknown[] }).page)
  ) {
    return (result as { page: unknown[] }).page;
  }
  return Array.isArray(result) ? result : [];
}

const certificateValidator = v.object({
  _id: v.id("employeeCertificates"),
  storageId: v.id("_storage"),
  fileName: v.string(),
  contentType: v.string(),
});

const profileReturn = v.object({
  _id: v.id("employeeProfiles"),
  organizationId: v.string(),
  userId: v.string(),
  onboardingStatus: v.union(v.literal("pending"), v.literal("completed")),
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
  certificates: v.array(certificateValidator),
});

export const getInvitationPreview = query({
  args: {
    invitationId: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.string(),
      email: v.string(),
      organizationId: v.string(),
      organizationName: v.string(),
      organizationSlug: v.string(),
      organizationLogo: v.union(v.string(), v.null()),
      expiresAt: v.number(),
      role: v.union(v.string(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const invitation = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "invitation",
        where: [{ field: "_id", operator: "eq", value: args.invitationId }],
      },
    );

    if (!invitation) return null;

    const inv = invitation as {
      _id: string;
      email: string;
      organizationId: string;
      status: string;
      expiresAt: number;
      role?: string | null;
    };

    const organization = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "organization",
        where: [
          { field: "_id", operator: "eq", value: inv.organizationId },
        ],
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

export const ensureProfileAfterInvite = internalMutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.id("employeeProfiles"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("employeeProfiles", {
      organizationId: args.organizationId,
      userId: args.userId,
      onboardingStatus: "pending",
      onboardingStep: 0,
    });
  },
});

export const getMyOnboardingStatus = query({
  args: {},
  returns: v.union(
    v.object({
      organizationId: v.string(),
      organizationSlug: v.string(),
      onboardingStatus: v.union(v.literal("pending"), v.literal("completed")),
      onboardingStep: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const context = await getOrganizationContext(ctx);
    if (!context) return null;

    const { orgId, userId } = context;

    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", orgId).eq("userId", userId),
      )
      .unique();

    if (!profile) return null;

    const organization = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "organization",
        where: [{ field: "_id", operator: "eq", value: orgId }],
      },
    );

    const org = organization as { slug: string } | null;

    return {
      organizationId: orgId,
      organizationSlug: org?.slug ?? "",
      onboardingStatus: profile.onboardingStatus,
      onboardingStep: profile.onboardingStep,
    };
  },
});

export const getMyProfile = query({
  args: {},
  returns: v.union(profileReturn, v.null()),
  handler: async (ctx) => {
    const { orgId, userId } = await requireOrganization(ctx);

    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", orgId).eq("userId", userId),
      )
      .unique();

    if (!profile) return null;

    const certificates = await ctx.db
      .query("employeeCertificates")
      .withIndex("by_profile", (q) => q.eq("employeeProfileId", profile._id))
      .take(MAX_CERTIFICATES);

    return {
      ...profile,
      certificates: certificates.map((c) => ({
        _id: c._id,
        storageId: c.storageId,
        fileName: c.fileName,
        contentType: c.contentType,
      })),
    };
  },
});

async function getOrCreateMyProfile(
  ctx: MutationCtx,
  orgId: string,
  userId: string,
): Promise<Doc<"employeeProfiles">> {
  const existing = await ctx.db
    .query("employeeProfiles")
    .withIndex("by_org_user", (q) =>
      q.eq("organizationId", orgId).eq("userId", userId),
    )
    .unique();

  if (existing) return existing;

  const id = await ctx.db.insert("employeeProfiles", {
    organizationId: orgId,
    userId,
    onboardingStatus: "pending",
    onboardingStep: 0,
  });

  const created = await ctx.db.get(id);
  if (!created) throw new Error("Failed to create employee profile.");
  return created;
}

export const saveGeneralInfo = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    address: v.string(),
    profilePhotoStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { orgId, userId } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, orgId, userId);

    await ctx.db.patch(profile._id, {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      dateOfBirth: args.dateOfBirth,
      address: args.address.trim(),
      profilePhotoStorageId: args.profilePhotoStorageId,
      onboardingStep: Math.max(profile.onboardingStep, 1),
    });

    return null;
  },
});

export const saveGovernmentId = mutation({
  args: {
    aadharNumber: v.string(),
    panNumber: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { orgId, userId } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, orgId, userId);

    await ctx.db.patch(profile._id, {
      aadharNumber: args.aadharNumber.trim(),
      panNumber: args.panNumber.trim().toUpperCase(),
      onboardingStep: Math.max(profile.onboardingStep, 2),
    });

    return null;
  },
});

export const saveBankDetails = mutation({
  args: {
    bankAccountNumber: v.string(),
    bankName: v.string(),
    ifscCode: v.string(),
    branchName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { orgId, userId } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, orgId, userId);

    await ctx.db.patch(profile._id, {
      bankAccountNumber: args.bankAccountNumber.trim(),
      bankName: args.bankName.trim(),
      ifscCode: args.ifscCode.trim().toUpperCase(),
      branchName: args.branchName.trim(),
      onboardingStep: Math.max(profile.onboardingStep, 3),
    });

    return null;
  },
});

export const addCertificate = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    contentType: v.string(),
  },
  returns: v.id("employeeCertificates"),
  handler: async (ctx, args) => {
    const { orgId, userId } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, orgId, userId);

    const existing = await ctx.db
      .query("employeeCertificates")
      .withIndex("by_profile", (q) => q.eq("employeeProfileId", profile._id))
      .take(MAX_CERTIFICATES + 1);

    if (existing.length >= MAX_CERTIFICATES) {
      throw new Error(`You can upload at most ${MAX_CERTIFICATES} documents.`);
    }

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowed.includes(args.contentType)) {
      throw new Error("Only PDF, JPG, JPEG, and PNG files are allowed.");
    }

    return await ctx.db.insert("employeeCertificates", {
      employeeProfileId: profile._id,
      organizationId: orgId,
      storageId: args.storageId,
      fileName: args.fileName,
      contentType: args.contentType,
    });
  },
});

export const removeCertificate = mutation({
  args: { certificateId: v.id("employeeCertificates") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { orgId, userId } = await requireMembership(ctx);
    const cert = await ctx.db.get(args.certificateId);

    if (!cert || cert.organizationId !== orgId) {
      throw new Error("Certificate not found.");
    }

    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", orgId).eq("userId", userId),
      )
      .unique();

    if (!profile || cert.employeeProfileId !== profile._id) {
      throw new Error("Certificate not found.");
    }

    await ctx.db.delete(args.certificateId);
    return null;
  },
});

export const completeOnboarding = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { orgId, userId } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, orgId, userId);

    if (
      !profile.firstName ||
      !profile.lastName ||
      !profile.dateOfBirth ||
      !profile.address
    ) {
      throw new Error("Please complete general information first.");
    }

    if (!profile.aadharNumber || !profile.panNumber) {
      throw new Error("Please complete government ID details first.");
    }

    if (
      !profile.bankAccountNumber ||
      !profile.bankName ||
      !profile.ifscCode ||
      !profile.branchName
    ) {
      throw new Error("Please complete bank details first.");
    }

    await ctx.db.patch(profile._id, {
      onboardingStatus: "completed",
      onboardingStep: 4,
    });

    return null;
  },
});

export const listMembers = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      userId: v.string(),
      role: v.string(),
      createdAt: v.number(),
      name: v.string(),
      email: v.string(),
      image: v.union(v.string(), v.null()),
      active: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    await requirePermission(ctx, { employee: ["list"] });
    const { orgId } = await requireOrganization(ctx);

    const membersResult = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "member",
        where: [
          { field: "organizationId", operator: "eq", value: orgId },
        ],
        paginationOpts: { numItems: 200, cursor: null },
      },
    );

    const memberList = getAdapterPage(membersResult) as Array<{
      _id: string;
      userId: string;
      role: string;
      createdAt: number;
    }>;

    const result = [];
    for (const m of memberList) {
      const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user",
        where: [{ field: "_id", operator: "eq", value: m.userId }],
      });

      const u = user as {
        name: string;
        email: string;
        image?: string | null;
      } | null;

      const profile = await ctx.db
        .query("employeeProfiles")
        .withIndex("by_org_user", (q) =>
          q.eq("organizationId", orgId).eq("userId", m.userId),
        )
        .unique();

      result.push({
        id: m._id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        name: u?.name ?? "Unknown",
        email: u?.email ?? "",
        image: u?.image ?? null,
        active: profile?.onboardingStatus === "completed",
      });
    }

    return result;
  },
});

export const listPendingInvitations = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      email: v.string(),
      role: v.union(v.string(), v.null()),
      status: v.string(),
      expiresAt: v.number(),
    }),
  ),
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

    const list = getAdapterPage(invitationsResult) as Array<{
      _id: string;
      email: string;
      role?: string | null;
      status: string;
      expiresAt: number;
    }>;

    return list.map((inv) => ({
      id: inv._id,
      email: inv.email,
      role: inv.role ?? null,
      status: inv.status,
      expiresAt: inv.expiresAt,
    }));
  },
});

export const getMemberRole = query({
  args: { organizationId: v.optional(v.string()) },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const orgId = args.organizationId ?? identity.orgId;
    if (!orgId) return null;

    const member = await getMemberForUser(ctx, orgId, identity.userId);
    return member?.role ?? null;
  },
});
