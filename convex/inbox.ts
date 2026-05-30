import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import {
  organizationMutation,
  organizationQuery,
  privateInternalMutation,
  privateMutation,
  privateQuery,
} from './lib/customFunctions'
import { InboxValidator } from './schema'

export const createInboxItem = privateInternalMutation({
  args: InboxValidator.omit('read', 'archived'),
  handler: async (ctx, args) => {
    const insertedItemId = await ctx.db.insert('inboxItems', {
      ...args,
      archived: false,
      read: false,
    })
    return insertedItemId
  },
})

export const list = organizationQuery({
  args: {
    filter: v.union(v.literal('inbox'), v.literal('archive')),
  },
  handler: async (ctx, args) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    if (args.filter === 'inbox') {
      return await ctx.db
        .query('inboxItems')
        .withIndex('by_org_recipient_archived', (q) =>
          q
            .eq('organizationId', orgId)
            .eq('recipientUserId', userId)
            .eq('archived', false),
        )
        .order('desc')
        .take(100)
    }

    return await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived', (q) =>
        q
          .eq('organizationId', orgId)
          .eq('recipientUserId', userId)
          .eq('archived', true),
      )
      .order('desc')
      .take(100)
  },
})

export const get = privateQuery({
  args: { id: v.id('inboxItems') },
  handler: async (ctx, args) => {
    const { userId } = ctx.session

    const item = await ctx.db.get(args.id)
    if (!item || item.recipientUserId !== userId) {
      return null
    }

    return item
  },
})

/** Latest onboarding inbox item for the active org (used after accepting an invite). */
export const getOnboardingInboxItemId = organizationQuery({
  args: {},
  returns: v.union(v.id('inboxItems'), v.null()),
  handler: async (ctx) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    const items = await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived', (q) =>
        q
          .eq('organizationId', orgId)
          .eq('recipientUserId', userId)
          .eq('archived', false),
      )
      .order('desc')
      .take(20)

    const onboarding = items.find((item) => item.kind === 'onboarding')
    return onboarding?._id ?? null
  },
})

export const unreadCount = organizationQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    const unread = await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived_read', (q) =>
        q
          .eq('organizationId', orgId)
          .eq('recipientUserId', userId)
          .eq('archived', false)
          .eq('read', false),
      )
      .take(101)

    return unread.length
  },
})

export const archiveCount = organizationQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    const unread = await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived', (q) =>
        q
          .eq('organizationId', orgId)
          .eq('recipientUserId', userId)
          .eq('archived', true),
      )
      .take(101)

    return unread.length
  },
})

export const markRead = privateMutation({
  args: { itemId: v.id('inboxItems') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.itemId)
    if (!doc || doc.recipientUserId !== ctx.session.userId) {
      throw new Error('Not found')
    }
    await ctx.db.patch(args.itemId, { read: true })
    return null
  },
})

export const markUnread = privateMutation({
  args: { itemId: v.id('inboxItems') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = ctx.session

    const doc = await ctx.db.get(args.itemId)
    if (!doc || doc.recipientUserId !== userId) {
      throw new Error('Not found')
    }
    await ctx.db.patch(args.itemId, { read: false })
    return null
  },
})

export const listArchived = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    return await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived', (q) =>
        q
          .eq('organizationId', orgId)
          .eq('recipientUserId', userId)
          .eq('archived', true),
      )
      .order('desc')
      .take(100)
  },
})

export const archive = privateMutation({
  args: { itemId: v.id('inboxItems') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = ctx.session

    const doc = await ctx.db.get(args.itemId)
    if (!doc || doc.recipientUserId !== userId) {
      throw new Error('Not found')
    }
    await ctx.db.patch(args.itemId, { archived: true })
    return null
  },
})

export const unarchive = privateMutation({
  args: { itemId: v.id('inboxItems') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = ctx.session

    const doc = await ctx.db.get(args.itemId)
    if (!doc || doc.recipientUserId !== userId) {
      throw new Error('Not found')
    }
    await ctx.db.patch(args.itemId, { archived: false })
    return null
  },
})

export const permanentlyDelete = privateMutation({
  args: { itemId: v.id('inboxItems') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = ctx.session

    const doc = await ctx.db.get(args.itemId)
    if (!doc || doc.recipientUserId !== userId) {
      throw new Error('Not found')
    }
    if (!doc.archived) {
      throw new Error('Only archived messages can be permanently deleted')
    }
    await ctx.db.delete(args.itemId)
    return null
  },
})

export const deleteAllArchived = organizationMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    const archived = await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived', (q) =>
        q
          .eq('organizationId', orgId)
          .eq('recipientUserId', userId)
          .eq('archived', true),
      )
      .take(100)

    for (const item of archived) {
      await ctx.db.delete(item._id)
    }

    return archived.length
  },
})

export const markAllRead = organizationMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    const unread = await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived_read', (q) =>
        q
          .eq('organizationId', orgId)
          .eq('recipientUserId', userId)
          .eq('archived', false)
          .eq('read', false),
      )
      .take(100)

    for (const item of unread) {
      await ctx.db.patch(item._id, { read: true })
    }
    return null
  },
})

/** Idempotent seed so new workspaces have a Linear-style inbox preview. */
export const seedWelcomeItems = organizationMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { userId, activeOrganizationId: orgId } = ctx.session

    const existing = await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived', (q) =>
        q
          .eq('organizationId', orgId)
          .eq('recipientUserId', userId)
          .eq('archived', false),
      )
      .take(20)

    if (existing.some((item) => item.kind === 'onboarding')) {
      return null
    }

    if (existing.length > 0) {
      return null
    }

    const samples: Omit<Doc<'inboxItems'>, '_id' | '_creationTime'>[] = [
      {
        organizationId: orgId,
        recipientUserId: userId,
        kind: 'system',
        title: 'Welcome to your inbox',
        snippet: 'Notifications about your workspace show up here.',
        body: 'This is where assignments, comments, invites, and updates appear—similar to Linear. Archive items when you’re done, or mark everything read from the toolbar.\n\nYou can dismiss this message anytime.',
        read: false,
        archived: false,
      },
      {
        organizationId: orgId,
        recipientUserId: userId,
        kind: 'assignment',
        title: 'Review Q1 attendance export',
        snippet: 'Assigned to you · Due soon',
        body: 'Please review the attendance export before Friday. Finance needs sign-off on the employee totals section.',
        read: false,
        archived: false,
        actorName: 'Alex Rivera',
      },
      {
        organizationId: orgId,
        recipientUserId: userId,
        kind: 'comment',
        title: 'Re: Employee onboarding checklist',
        snippet: 'Jordan left a comment',
        body: 'Can we add a step for IT hardware handoff? New hires are waiting on laptops.',
        read: true,
        archived: false,
        actorName: 'Jordan Lee',
      },
      {
        organizationId: orgId,
        recipientUserId: userId,
        kind: 'invite',
        title: 'Invite: Product team workspace',
        snippet: 'You’ve been invited as an employee',
        body: 'You have access to shared projects and the product roadmap. Say hi in #general when you’re in.',
        read: true,
        archived: false,
        actorName: 'Sam Chen',
      },
      {
        organizationId: orgId,
        recipientUserId: userId,
        kind: 'system',
        title: 'Weekly digest',
        snippet: '3 updates in your organization',
        body: '— Two attendance exceptions were filed.\n— Settings were updated for time zones.\n— No failed payroll syncs this week.',
        read: false,
        archived: false,
      },
    ]

    for (const row of samples) {
      await ctx.db.insert('inboxItems', row)
    }

    return null
  },
})
