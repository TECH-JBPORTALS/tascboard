import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const inboxItems = defineTable({
  organizationId: v.string(),
  recipientUserId: v.string(),
  kind: v.union(
    v.literal('assignment'),
    v.literal('comment'),
    v.literal('invite'),
    v.literal('system'),
    v.literal('onboarding'),
  ),
  title: v.string(),
  snippet: v.optional(v.string()),
  body: v.optional(v.string()),
  read: v.boolean(),
  archived: v.boolean(),
  actorName: v.optional(v.string()),
})
  .index('by_org_recipient_archived', [
    'organizationId',
    'recipientUserId',
    'archived',
  ])
  .index('by_org_recipient_archived_read', [
    'organizationId',
    'recipientUserId',
    'archived',
    'read',
  ])
  .index('by_organization', ['organizationId'])
