import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const onboardingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
);

export default defineSchema({
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

  employeeProfiles: defineTable({
    organizationId: v.string(),
    userId: v.string(),
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
  })
    .index("by_org_user", ["organizationId", "userId"])
    .index("by_user", ["userId"]),

  employeeCertificates: defineTable({
    employeeProfileId: v.id("employeeProfiles"),
    organizationId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    contentType: v.string(),
  }).index("by_profile", ["employeeProfileId"]),
});
