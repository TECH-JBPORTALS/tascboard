import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
});
