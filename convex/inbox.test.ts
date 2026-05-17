import { beforeEach, describe, expect, test } from "vitest";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { DataModel } from "./_generated/dataModel";

describe("Inbox", () => {
  let t: TestConvexForDataModel<DataModel>;

  beforeEach(() => {
    t = convexTest(schema, modules).withIdentity({
      subject: "user-1",
    });
  });

  test("seedWelcomeItems creates default inbox items", async () => {
    await t.mutation(api.inbox.seedWelcomeItems);

    const items = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "all",
    });

    expect(items.length).toBeGreaterThanOrEqual(5);

    expect(items.some((x) => x.title.includes("Welcome"))).toBe(true);
  });

  test("seedWelcomeItems is idempotent", async () => {
    await t.mutation(api.inbox.seedWelcomeItems);

    await t.mutation(api.inbox.seedWelcomeItems);

    const items = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "all",
    });

    expect(items.length).toBe(5);
  });

  test("internal mutation creates inbox item", async () => {
    const id = await t.mutation(internal.inbox.createInboxItem, {
      title: "Assigned new task",
      actorName: "Walter White",
      kind: "assignment",
      organizationId: "org-1",
      recipientUserId: "user-1",
      body: "Finish ERP module",
    });

    expect(id).toBeDefined();

    const items = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "all",
    });

    expect(items.length).toBe(1);

    expect(items[0]?.title).toBe("Assigned new task");
    expect(items[0]?.read).toBe(false);
    expect(items[0]?.archived).toBe(false);
  });

  test("unreadCount returns correct count", async () => {
    await t.mutation(internal.inbox.createInboxItem, {
      title: "Unread item",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    const count = await t.query(api.inbox.unreadCount);

    expect(count).toBe(1);
  });

  test("markRead marks item as read", async () => {
    const itemId = await t.mutation(internal.inbox.createInboxItem, {
      title: "Read me",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    await t.mutation(api.inbox.markRead, {
      itemId,
    });

    const unread = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "unread",
    });

    expect(unread.length).toBe(0);
  });

  test("markUnread marks item as unread again", async () => {
    const itemId = await t.mutation(internal.inbox.createInboxItem, {
      title: "Toggle read",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    await t.mutation(api.inbox.markRead, {
      itemId,
    });

    await t.mutation(api.inbox.markUnread, {
      itemId,
    });

    const unread = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "unread",
    });

    expect(unread.length).toBe(1);
  });

  test("archive removes item from active inbox", async () => {
    const itemId = await t.mutation(internal.inbox.createInboxItem, {
      title: "Archive me",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    await t.mutation(api.inbox.archive, {
      itemId,
    });

    const items = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "all",
    });

    expect(items.length).toBe(0);
  });

  test("markAllRead marks every unread item as read", async () => {
    await t.mutation(internal.inbox.createInboxItem, {
      title: "Item 1",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    await t.mutation(internal.inbox.createInboxItem, {
      title: "Item 2",
      kind: "assignment",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    await t.mutation(api.inbox.markAllRead);

    const unread = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "unread",
    });

    expect(unread.length).toBe(0);
  });

  test("users cannot mark another user's inbox item as read", async () => {
    const itemId = await t.mutation(internal.inbox.createInboxItem, {
      title: "Private item",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "another-user",
    });

    await expect(
      t.mutation(api.inbox.markRead, {
        itemId,
      }),
    ).rejects.toThrow("Not found");
  });

  test("list only returns current user's items", async () => {
    await t.mutation(internal.inbox.createInboxItem, {
      title: "My item",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    await t.mutation(internal.inbox.createInboxItem, {
      title: "Other user item",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "user-2",
    });

    const items = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "all",
    });

    expect(items.length).toBe(1);

    expect(items[0]?.title).toBe("My item");
  });

  test("unread filter only returns unread items", async () => {
    const itemId = await t.mutation(internal.inbox.createInboxItem, {
      title: "Unread item",
      kind: "system",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    await t.mutation(internal.inbox.createInboxItem, {
      title: "Another unread item",
      kind: "assignment",
      organizationId: "org-1",
      recipientUserId: "user-1",
    });

    await t.mutation(api.inbox.markRead, {
      itemId,
    });

    const unread = await t.query(api.inbox.list, {
      organizationId: "org-1",
      filter: "unread",
    });

    expect(unread.length).toBe(1);

    expect(unread[0]?.title).toBe("Another unread item");
  });
});

const modules = import.meta.glob("./**/*.ts");
