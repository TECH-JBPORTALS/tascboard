"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  RiArrowUpLine,
  RiCheckLine,
  RiMore2Line,
  RiPencilLine,
  RiDeleteBinLine,
} from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useActor } from "@/hooks/use-actor";
import { isPlateContentEmpty, PLATE_DEFAULT_VALUE } from "@/lib/plate-content";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PlateEditor } from "../editor/plate-editor";

type TaskCommentsSectionProps = {
  taskId: Id<"tasks">;
};

type CommentDoc = Doc<"comments">;

function buildThreads(comments: CommentDoc[]) {
  const roots = comments.filter((c) => c.parentCommentId === null);
  const repliesByRoot = new Map<string, CommentDoc[]>();

  for (const comment of comments) {
    if (!comment.parentCommentId) continue;
    const rootId = comment.parentCommentId;
    const list = repliesByRoot.get(rootId) ?? [];
    list.push(comment);
    repliesByRoot.set(rootId, list);
  }

  for (const [, replies] of repliesByRoot) {
    replies.sort((a, b) => a._creationTime - b._creationTime);
  }

  return roots
    .sort((a, b) => a._creationTime - b._creationTime)
    .map((root) => ({
      root,
      replies: repliesByRoot.get(root._id) ?? [],
    }));
}

function CommentMenu({
  comment,
  isReply,
  deviceName,
  onEdit,
}: {
  comment: CommentDoc;
  isReply: boolean;
  deviceName: string;
  onEdit: () => void;
}) {
  const removeComment = useMutation(api.comment.remove);
  const toggleResolution = useMutation(api.comment.toggleResolution);
  const isOwner = comment.deviceName === deviceName;

  if (!isOwner) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:opacity-100 data-open:opacity-100"
        aria-label="Comment actions"
      >
        <RiMore2Line className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onEdit}>
          <RiPencilLine className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void toggleResolution({ commentId: comment._id })}
        >
          <RiCheckLine className="size-4" />
          {isReply ? "Resolve thread with comment" : "Resolve thread"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            void removeComment({ commentId: comment._id, deviceName })
          }
        >
          <RiDeleteBinLine className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CommentItem({
  comment,
  isReply,
  deviceName,
  displayName,
}: {
  comment: CommentDoc;
  isReply: boolean;
  deviceName: string;
  displayName: string;
}) {
  const editComment = useMutation(api.comment.edit);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(comment.body);

  const authorLabel =
    comment.deviceName === deviceName ? displayName : comment.deviceName;

  async function handleSave(value: unknown) {
    setDraft(value);
    if (isPlateContentEmpty(value)) return;
    await editComment({
      commentId: comment._id,
      body: value,
      deviceName,
    });
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "group rounded-lg px-2 py-2 hover:bg-muted/30",
        comment.isResolution && "ring-1 ring-emerald-500/30",
        isReply && "ml-8 border-l-2 border-border/60 pl-4",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{authorLabel}</span>
          <span>
            {formatDistanceToNow(comment._creationTime, { addSuffix: true })}
          </span>
          {comment.editedAt ? <span>(edited)</span> : null}
          {comment.isResolution ? (
            <span className="text-emerald-600">Resolved</span>
          ) : null}
        </div>
        <CommentMenu
          comment={comment}
          isReply={isReply}
          deviceName={deviceName}
          onEdit={() => setEditing(true)}
        />
      </div>

      {editing ? (
        <div className="space-y-2">
          <PlateEditor
            value={typeof draft === "string" ? draft : ""}
            onSave={setDraft}
            onChange={setDraft}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSave(draft)}
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}

function ReplyComposer({
  taskId,
  parentCommentId,
  deviceName,
}: {
  taskId: Id<"tasks">;
  parentCommentId: Id<"comments">;
  deviceName: string;
}) {
  const createComment = useMutation(api.comment.create);
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<unknown>(PLATE_DEFAULT_VALUE);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(nextValue: unknown = value) {
    if (submitting) return;
    setValue(nextValue);
    if (isPlateContentEmpty(nextValue)) return;
    setSubmitting(true);
    try {
      await createComment({
        taskId,
        parentCommentId,
        deviceName,
        body: nextValue,
      });
      setValue(PLATE_DEFAULT_VALUE);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="ml-8 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        Leave a reply…
      </button>
    );
  }

  return (
    <div className="ml-8 space-y-2 border-l-2 border-border/60 pl-4">
      <PlateEditor
        value={typeof value === "string" ? value : ""}
        onChange={setValue}
        placeholder="Leave a reply…"
        onSave={(markdown) => void handleSubmit(markdown)}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          Reply
        </Button>
      </div>
    </div>
  );
}

export function TaskCommentsSection({ taskId }: TaskCommentsSectionProps) {
  const comments = useQuery(api.comment.listByTask, { taskId });
  const createComment = useMutation(api.comment.create);
  const { deviceName, displayName } = useActor();
  const [draft, setDraft] = React.useState<unknown>(PLATE_DEFAULT_VALUE);
  const [submitting, setSubmitting] = React.useState(false);

  const threads = comments ? buildThreads(comments) : [];

  async function handleSubmit(nextDraft: unknown = draft) {
    if (submitting) return;
    setDraft(nextDraft);
    if (isPlateContentEmpty(nextDraft)) return;
    setSubmitting(true);
    try {
      await createComment({
        taskId,
        parentCommentId: null,
        deviceName,
        body: nextDraft,
      });
      setDraft(PLATE_DEFAULT_VALUE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4 border-t border-border/60 pt-6">
      {threads.map(({ root, replies }) => (
        <div key={root._id} className="space-y-2">
          <CommentItem
            comment={root}
            isReply={false}
            deviceName={deviceName}
            displayName={displayName}
          />
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              isReply
              deviceName={deviceName}
              displayName={displayName}
            />
          ))}
          <ReplyComposer
            taskId={taskId}
            parentCommentId={root._id}
            deviceName={deviceName}
          />
        </div>
      ))}

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <PlateEditor
          value={typeof draft === "string" ? draft : ""}
          onChange={setDraft}
          placeholder="Leave a comment…"
          onSave={(markdown) => void handleSubmit(markdown)}
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="icon-sm"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            aria-label="Post comment"
          >
            <RiArrowUpLine className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
