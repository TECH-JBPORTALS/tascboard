"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { Button } from "../ui/button";
import { RiArchiveLine } from "@remixicon/react";
import { useEffect } from "react";
import { Spinner } from "../ui/spinner";
import { InboxOnboardingPanel } from "./InboxOnboardingPanel";
import { motion } from "motion/react";

function kindLabel(kind: Doc<"inboxItems">["kind"]): string {
  switch (kind) {
    case "assignment":
      return "Assignment";
    case "comment":
      return "Comment";
    case "invite":
      return "Invite";
    case "onboarding":
      return "Onboarding";
    default:
      return "Update";
  }
}

export function InboxPage() {
  const { inboxItemId } = useParams<{ inboxItemId: Id<"inboxItems"> }>();
  const selected = useQuery(api.inbox.get, { id: inboxItemId });
  const onboardingStatus = useQuery(
    api.employees.profile.getMyOnboardingStatus,
    {},
  );
  const markReadMutation = useMutation(api.inbox.markRead);
  const archiveMutation = useMutation(api.inbox.archive);

  const isOnboardingMessage = selected?.kind === "onboarding";
  const showOnboardingWizard =
    isOnboardingMessage && onboardingStatus?.onboardingStatus === "pending";

  useEffect(() => {
    if (!selected || selected.read || showOnboardingWizard) {
      return;
    }
    void markReadMutation({ itemId: selected._id });
  }, [selected, markReadMutation, showOnboardingWizard]);

  return (
    <motion.div className="hidden min-h-0 min-w-0 flex-1 flex-col bg-muted/20 md:flex">
      {!selected ? (
        <motion.div
          className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Spinner className="size-5" />
        </motion.div>
      ) : showOnboardingWizard ? (
        <InboxOnboardingPanel
          initialStep={onboardingStatus?.onboardingStep ?? 0}
        />
      ) : (
        <>
          <div className="shrink-0 space-y-3 border-b border-border/60 bg-background/80 px-6 py-5 backdrop-blur-sm">
            <motion.div
              className="flex flex-wrap items-center gap-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
            </motion.div>
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
          <motion.div
            className="flex shrink-0 flex-wrap gap-2 border-t border-border/60 bg-background/90 px-6 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
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
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
