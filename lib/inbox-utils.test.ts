import { describe, expect, test } from "vitest";
import {
  filterInboxItems,
  getAdjacentInboxItemId,
  getInboxItemIdAfterArchive,
  matchesInboxSearch,
} from "./inbox-utils";
import type { Doc } from "@/convex/_generated/dataModel";

function item(
  overrides: Partial<Doc<"inboxItems">> & Pick<Doc<"inboxItems">, "_id">,
): Doc<"inboxItems"> {
  return {
    _creationTime: 1,
    organizationId: "org-1",
    recipientUserId: "user-1",
    kind: "system",
    title: "Title",
    read: false,
    archived: false,
    ...overrides,
  };
}

describe("inbox-utils", () => {
  test("matchesInboxSearch matches title and body", () => {
    const doc = item({
      _id: "a" as Doc<"inboxItems">["_id"],
      title: "Payroll update",
      body: "Finance review",
    });
    expect(matchesInboxSearch(doc, "payroll")).toBe(true);
    expect(matchesInboxSearch(doc, "finance")).toBe(true);
    expect(matchesInboxSearch(doc, "missing")).toBe(false);
  });

  test("filterInboxItems returns all when query empty", () => {
    const items = [
      item({ _id: "a" as Doc<"inboxItems">["_id"] }),
      item({ _id: "b" as Doc<"inboxItems">["_id"] }),
    ];
    expect(filterInboxItems(items, "").length).toBe(2);
  });

  test("getAdjacentInboxItemId moves through list", () => {
    const items = [
      item({ _id: "a" as Doc<"inboxItems">["_id"] }),
      item({ _id: "b" as Doc<"inboxItems">["_id"] }),
      item({ _id: "c" as Doc<"inboxItems">["_id"] }),
    ];
    expect(getAdjacentInboxItemId(items, "a", "next")).toBe("b");
    expect(getAdjacentInboxItemId(items, "b", "previous")).toBe("a");
  });

  test("getInboxItemIdAfterArchive selects next or previous", () => {
    const items = [
      item({ _id: "a" as Doc<"inboxItems">["_id"] }),
      item({ _id: "b" as Doc<"inboxItems">["_id"] }),
      item({ _id: "c" as Doc<"inboxItems">["_id"] }),
    ];
    expect(getInboxItemIdAfterArchive(items, "b")).toBe("c");
    expect(getInboxItemIdAfterArchive(items, "c")).toBe("b");
    expect(getInboxItemIdAfterArchive(items, "a")).toBe("b");
  });
});
