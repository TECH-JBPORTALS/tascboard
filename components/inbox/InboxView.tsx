"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  RiArchiveLine,
  RiChat3Line,
  RiCheckboxCircleLine,
  RiInboxLine,
  RiMailLine,
  RiNotification3Line,
} from "@remixicon/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type InboxFilter = "all" | "unread";

type InboxItem = {
  _id: Id<"inboxItems">;
  _creationTime: number;
  kind: "assignment" | "comment" | "invite" | "system";
  title: string;
  snippet?: string;
  body?: string;
  read: boolean;
  actorName?: string;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function groupLabelForTimestamp(ts: number): "Today" | "Yesterday" | "Earlier" {
  const d = new Date(ts);
  const today = startOfLocalDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d >= today) {
    return "Today";
  }
  if (d >= yesterday) {
    return "Yesterday";
  }
  return "Earlier";
}

function kindLabel(kind: InboxItem["kind"]): string {
  switch (kind) {
    case "assignment":
      return "Assignment";
    case "comment":
      return "Comment";
    case "invite":
      return "Invite";
    default:
      return "Update";
  }
}

export function InboxView() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedId, setSelectedId] = useState<Id<"inboxItems"> | null>(null);

  const items = useQuery(
    api.inbox.list,
    organizationId ? { organizationId, filter } : "skip",
  ) as InboxItem[] | undefined;

  const seedWelcome = useMutation(api.inbox.seedWelcomeItems);
  const markReadMutation = useMutation(api.inbox.markRead);
  const markUnreadMutation = useMutation(api.inbox.markUnread);
  const archiveMutation = useMutation(api.inbox.archive);
  const markAllReadMutation = useMutation(api.inbox.markAllRead);

  useEffect(() => {
    if (!organizationId) {
      return;
    }
    void seedWelcome({ organizationId });
  }, [organizationId, seedWelcome]);

  const resolvedSelectedId = useMemo(() => {
    if (!items?.length) {
      return null;
    }
    if (selectedId && items.some((i) => i._id === selectedId)) {
      return selectedId;
    }
    return items[0]._id;
  }, [items, selectedId]);

  const selected = useMemo(
    () =>
      resolvedSelectedId
        ? (items?.find((i) => i._id === resolvedSelectedId) ?? null)
        : null,
    [items, resolvedSelectedId],
  );

  useEffect(() => {
    if (!selected || selected.read) {
      return;
    }
    void markReadMutation({ itemId: selected._id });
  }, [selected, markReadMutation]);

  const grouped = useMemo(() => {
    if (!items?.length) {
      return [];
    }
    const order: Array<"Today" | "Yesterday" | "Earlier"> = [
      "Today",
      "Yesterday",
      "Earlier",
    ];
    const map = new Map<string, InboxItem[]>();
    for (const label of order) {
      map.set(label, []);
    }
    for (const item of items) {
      const label = groupLabelForTimestamp(item._creationTime);
      map.get(label)!.push(item);
    }
    return order
      .map((label) => ({ label, items: map.get(label)! }))
      .filter((g) => g.items.length > 0);
  }, [items]);

  const flatIds = useMemo(
    () => grouped.flatMap((g) => g.items.map((i) => i._id)),
    [grouped],
  );

  const selectByOffset = useCallback(
    (delta: number) => {
      if (!flatIds.length) {
        return;
      }
      const idx = resolvedSelectedId ? flatIds.indexOf(resolvedSelectedId) : 0;
      const safeIdx = idx < 0 ? 0 : idx;
      const next = Math.min(flatIds.length - 1, Math.max(0, safeIdx + delta));
      setSelectedId(flatIds[next]);
    },
    [flatIds, resolvedSelectedId],
  );

  const handleArchive = useCallback(
    async (itemId: Id<"inboxItems">) => {
      await archiveMutation({ itemId });
    },
    [archiveMutation],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      if (e.key === "j" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectByOffset(1);
      }
      if (e.key === "k" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectByOffset(-1);
      }
      if (e.key === "e" && resolvedSelectedId && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        void handleArchive(resolvedSelectedId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectByOffset, resolvedSelectedId, handleArchive]);

  async function handleMarkAllRead() {
    if (!organizationId) {
      return;
    }
    await markAllReadMutation();
  }

  if (!organizationId) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading organization…
      </div>
    );
  }

  if (items === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading inbox…
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-8.5rem)] min-w-0 flex-1 flex-col overflow-hidden bg-background shadow-sm md:min-h-[calc(100dvh-7rem)]">
      <PageHeader
        icon={<RiInboxLine />}
        title="Inbox"
        description={
          <>
            {items.length} notification{items.length === 1 ? "" : "s"} ·{" "}
            <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
              j
            </kbd>
            <kbd className="ml-1 rounded border bg-muted px-1 font-mono text-[10px]">
              k
            </kbd>{" "}
            navigate ·{" "}
            <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
              e
            </kbd>{" "}
            archive
          </>
        }
        actions={
          <>
            <div className="flex rounded-lg bg-muted/80 p-0.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === "unread"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Unread
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              type="button"
              onClick={() => void handleMarkAllRead()}
            >
              Mark all read
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 divide-x divide-border/60"></div>

      {selected ? (
        <div className="border-t border-border/60 p-4 md:hidden">
          <Separator className="mb-4 md:hidden" />
          <h2 className="font-heading text-base font-semibold">
            {selected.title}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {selected.body ?? selected.snippet}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => void handleArchive(selected._id)}
            >
              Archive
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
