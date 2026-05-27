// import { beforeEach, describe, expect, test } from 'bun:test'
// import { convexTest, TestConvexForDataModel } from 'convex-test'

// import { api, internal } from '../_generated/api'
// import { DataModel } from '../_generated/dataModel'
// import schema from '../schema'
// import { modules } from './_modules.test'

// describe('Inbox', () => {
//   let t: TestConvexForDataModel<DataModel>

//   beforeEach(() => {
//     t = convexTest(schema, modules).withIdentity({
//       userId: 'user-1',
//       orgId: 'org-1',
//     })
//   })

//   test('seedWelcomeItems creates default inbox items', async () => {
//     await t.mutation(api.inbox.seedWelcomeItems)

//     const items = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'inbox',
//     })

//     expect(items.length).toBeGreaterThanOrEqual(5)

//     expect(items.some((x) => x.title.includes('Welcome'))).toBe(true)
//   })

//   test('seedWelcomeItems is idempotent', async () => {
//     await t.mutation(api.inbox.seedWelcomeItems)

//     await t.mutation(api.inbox.seedWelcomeItems)

//     const items = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'inbox',
//     })

//     expect(items.length).toBe(5)
//   })

//   test('internal mutation creates inbox item', async () => {
//     const id = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Assigned new task',
//       actorName: 'Walter White',
//       kind: 'assignment',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//       body: 'Finish ERP module',
//     })

//     expect(id).toBeDefined()

//     const items = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'inbox',
//     })

//     expect(items.length).toBe(1)

//     expect(items[0]?.title).toBe('Assigned new task')
//     expect(items[0]?.read).toBe(false)
//     expect(items[0]?.archive).toBe(false)
//   })

//   test('unreadCount returns correct count', async () => {
//     await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Unread item',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     const count = await t.query(api.inbox.unreadCount)

//     expect(count).toBe(1)
//   })

//   test('markRead marks item as read', async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Read me',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(api.inbox.markRead, {
//       itemId,
//     })

//     const archive = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'archive',
//     })

//     expect(archive.length).toBe(0)
//   })

//   test('markUnread marks item as archive again', async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Toggle read',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(api.inbox.markRead, {
//       itemId,
//     })

//     await t.mutation(api.inbox.markUnread, {
//       itemId,
//     })

//     const archive = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'archive',
//     })

//     expect(archive.length).toBe(1)
//   })

//   test('archive removes item from active inbox', async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Archive me',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(api.inbox.archive, {
//       itemId,
//     })

//     const items = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'inbox',
//     })

//     expect(items.length).toBe(0)
//   })

//   test('listArchived returns archive items only', async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Archived item',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(api.inbox.archive, { itemId })

//     const archive = await t.query(api.inbox.listArchived)

//     expect(archive.length).toBe(1)
//     expect(archive[0]?.title).toBe('Archived item')
//   })

//   test('unarchive restores item to active inbox', async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Restore me',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(api.inbox.archive, { itemId })
//     await t.mutation(api.inbox.unarchive, { itemId })

//     const items = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'inbox',
//     })

//     expect(items.length).toBe(1)
//     expect(items[0]?.archive).toBe(false)
//   })

//   test('permanentlyDelete removes archive item', async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Delete me',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(api.inbox.archive, { itemId })
//     await t.mutation(api.inbox.permanentlyDelete, { itemId })

//     const archive = await t.query(api.inbox.listArchived)

//     expect(archive.length).toBe(0)
//   })

//   test('deleteinboxArchived removes every archive message', async () => {
//     await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Archived 1',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })
//     await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Archived 2',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     const items = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'inbox',
//     })
//     for (const item of items) {
//       await t.mutation(api.inbox.archive, { itemId: item._id })
//     }

//     const deleted = await t.mutation(api.inbox.deleteinboxArchived)

//     expect(deleted).toBe(2)

//     const archive = await t.query(api.inbox.listArchived)
//     expect(archive.length).toBe(0)

//     const active = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'inbox',
//     })
//     expect(active.length).toBe(0)
//   })

//   test('permanentlyDelete rejects non-archive items', async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Active item',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await expect(
//       t.mutation(api.inbox.permanentlyDelete, { itemId }),
//     ).rejects.toThrow('Only archive messages can be permanently deleted')
//   })

//   test('markinboxRead marks every archive item as read', async () => {
//     await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Item 1',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Item 2',
//       kind: 'assignment',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(api.inbox.markinboxRead)

//     const archive = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'archive',
//     })

//     expect(archive.length).toBe(0)
//   })

//   test("users cannot mark another user's inbox item as read", async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Private item',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'another-user',
//     })

//     await expect(
//       t.mutation(api.inbox.markRead, {
//         itemId,
//       }),
//     ).rejects.toThrow('Not found')
//   })

//   test("list only returns current user's items", async () => {
//     await t.mutation(internal.inbox.createInboxItem, {
//       title: 'My item',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Other user item',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-2',
//     })

//     const items = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'inbox',
//     })

//     expect(items.length).toBe(1)

//     expect(items[0]?.title).toBe('My item')
//   })

//   test('archive filter only returns archive items', async () => {
//     const itemId = await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Unread item',
//       kind: 'system',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(internal.inbox.createInboxItem, {
//       title: 'Another archive item',
//       kind: 'assignment',
//       organizationId: 'org-1',
//       recipientUserId: 'user-1',
//     })

//     await t.mutation(api.inbox.markRead, {
//       itemId,
//     })

//     const archive = await t.query(api.inbox.list, {
//       organizationId: 'org-1',
//       filter: 'archive',
//     })

//     expect(archive.length).toBe(1)

//     expect(archive[0]?.title).toBe('Another archive item')
//   })
// })
