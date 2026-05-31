import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const employeeProfiles = defineTable({
  employeeId: v.string(),
  onboardingStatus: v.union(v.literal('pending'), v.literal('completed')),
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
}).index('by_employee', ['employeeId'])
