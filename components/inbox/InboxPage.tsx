"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { Button } from "../ui/button";
import { RiArchiveLine } from "@remixicon/react";
import { useEffect } from "react";

function kindLabel(kind: Doc<"inboxItems">["kind"]): string {
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

export function InboxPage() {
  const { inboxItemId } = useParams<{ inboxItemId: Id<"inboxItems"> }>();
  const selected = useQuery(api.inbox.get, { inboxItemId });
  const markReadMutation = useMutation(api.inbox.markRead);
  const markUnreadMutation = useMutation(api.inbox.markUnread);
  const archiveMutation = useMutation(api.inbox.archive);

  useEffect(() => {
    if (!selected || selected.read) {
      return;
    }
    void markReadMutation({ itemId: selected._id });
  }, [selected, markReadMutation]);

  return (
    <div className="hidden min-h-0 min-w-0 flex-1 flex-col bg-muted/20 md:flex">
      {!selected ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm text-muted-foreground">Select a notification</p>
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
                {new Date(selected._creationTime).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
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
              {selected.body ?? selected.snippet ?? "No additional details."}
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
              onClick={() => void archiveMutation({ itemId: selected._id })}
            >
              <RiArchiveLine className="size-4" />
              Archive
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
