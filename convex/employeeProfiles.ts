import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { getOrganizationContext, requireMembership } from "./lib/auth";
import { getEmployeeForUser } from "./lib/employees";
import { employeeProfileSchema } from "./schema";

const MAX_CERTIFICATES = 5;

const profileReturn = employeeProfileSchema;

export const ensureProfileAfterInvite = internalMutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.id("employeeProfiles"),
  handler: async (ctx, args) => {
    const employee = await getEmployeeForUser(
      ctx,
      args.organizationId,
      args.userId,
    );

    if (!employee) {
      throw new Error("Employee record not found after invitation acceptance.");
    }

    const existing = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("employeeProfiles", {
      employeeId: employee._id,
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
    const employee = await getEmployeeForUser(ctx, orgId, userId);
    if (!employee) return null;

    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
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
    const { employee } = await requireMembership(ctx);

    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
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
  employeeId: string,
): Promise<Doc<"employeeProfiles">> {
  const existing = await ctx.db
    .query("employeeProfiles")
    .withIndex("by_employee", (q) => q.eq("employeeId", employeeId))
    .unique();

  if (existing) return existing;

  const id = await ctx.db.insert("employeeProfiles", {
    employeeId,
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
    const { employee } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, employee._id);

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
    const { employee } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, employee._id);

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
    const { employee } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, employee._id);

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
    const { orgId, employee } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, employee._id);

    const existing = await ctx.db
      .query("employeeCertificates")
      .withIndex("by_profile", (q) => q.eq("employeeProfileId", profile._id))
      .take(MAX_CERTIFICATES + 1);

    if (existing.length >= MAX_CERTIFICATES) {
      throw new Error(`You can upload at most ${MAX_CERTIFICATES} documents.`);
    }

    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
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
    const { orgId, employee } = await requireMembership(ctx);
    const cert = await ctx.db.get(args.certificateId);

    if (!cert || cert.organizationId !== orgId) {
      throw new Error("Certificate not found.");
    }

    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
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
    const { employee } = await requireMembership(ctx);
    const profile = await getOrCreateMyProfile(ctx, employee._id);

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
