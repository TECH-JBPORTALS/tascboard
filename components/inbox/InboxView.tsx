"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
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

function formatListTime(ts: number): string {
  const d = new Date(ts);
  const today = startOfLocalDay(new Date());
  if (d >= today) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d >= yesterday) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (d >= new Date(today.getTime() - 6 * 86400000)) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function kindIcon(kind: InboxItem["kind"]) {
  const className = "size-4 shrink-0 text-muted-foreground";
  switch (kind) {
    case "assignment":
      return <RiCheckboxCircleLine className={className} />;
    case "comment":
      return <RiChat3Line className={className} />;
    case "invite":
      return <RiMailLine className={className} />;
    default:
      return <RiNotification3Line className={className} />;
  }
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
    await markAllReadMutation({ organizationId });
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
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <RiInboxLine className="size-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-base font-semibold tracking-tight">
              Inbox
            </h1>
            <p className="text-xs text-muted-foreground">
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
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </header>

      <div className="flex min-h-0 flex-1 divide-x divide-border/60">
        <div className="flex w-full min-w-0 flex-col md:w-[min(420px,42%)]">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <RiInboxLine className="size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">You’re all caught up</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {filter === "unread"
                  ? "No unread items. Switch to All to see everything."
                  : "New updates will land here."}
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {grouped.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 z-10 border-b border-border/40 bg-muted/70 px-4 py-1.5 backdrop-blur-sm">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      {group.label}
                    </span>
                  </div>
                  <ul className="divide-y divide-border/40">
                    {group.items.map((item) => {
                      const active = item._id === resolvedSelectedId;
                      return (
                        <li key={item._id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(item._id)}
                            className={cn(
                              "flex w-full gap-3 px-4 py-3 text-left transition-colors",
                              active ? "bg-accent/40" : "hover:bg-muted/60",
                            )}
                          >
                            {!item.read ? (
                              <span
                                className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                                aria-hidden
                              />
                            ) : (
                              <span className="mt-1.5 size-2 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                {kindIcon(item.kind)}
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      "truncate text-sm",
                                      !item.read
                                        ? "font-semibold text-foreground"
                                        : "font-medium text-foreground/90",
                                    )}
                                  >
                                    {item.title}
                                  </p>
                                  {item.snippet ? (
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                      {item.snippet}
                                    </p>
                                  ) : null}
                                </div>
                                <time
                                  className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                                  dateTime={new Date(
                                    item._creationTime,
                                  ).toISOString()}
                                >
                                  {formatListTime(item._creationTime)}
                                </time>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden min-h-0 min-w-0 flex-1 flex-col bg-muted/20 md:flex">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Select a notification
              </p>
            </div>
          ) : (
            <>
              <div className="shrink-0 space-y-3 border-b border-border/60 bg-background/80 px-6 py-5 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {kindLabel(selected.kind)}
                  </span>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={new Date(selected._creationTime).toISOString()}
                  >
                    {new Date(selected._creationTime).toLocaleString(
                      undefined,
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                    )}
                  </time>
                </div>
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  {selected.title}
                </h2>
                {selected.actorName ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {selected.actorName}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {selected.body ??
                    selected.snippet ??
                    "No additional details."}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/60 bg-background/90 px-6 py-3">
                {selected.read ? (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="h-8"
                    onClick={() =>
                      void markUnreadMutation({ itemId: selected._id })
                    }
                  >
                    Mark unread
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8"
                  onClick={() => void handleArchive(selected._id)}
                >
                  <RiArchiveLine className="size-4" />
                  Archive
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

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
