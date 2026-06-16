import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const employeeCertificates = defineTable({
  employeeProfileId: v.id('employeeProfiles'),
  organizationId: v.string(),
  storageId: v.id('_storage'),
  fileName: v.string(),
  contentType: v.string(),
})
  .index('by_profile', ['employeeProfileId'])
  .index('by_organization', ['organizationId'])
