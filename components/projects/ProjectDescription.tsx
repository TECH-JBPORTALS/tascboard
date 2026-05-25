"use client";

import React from "react";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GlobalTiptapEditor } from "@/components/editor/GlobalTiptapEditor";

const EMPTY_PROSEMIRROR_DOC = { type: "doc", content: [] };

export function ProjectDescription({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const sync = useTiptapSync(api.syncEditor, `project-${projectId}`);
  const { create, extension, initialContent, isLoading } = sync;

  React.useEffect(() => {
    if (isLoading || initialContent !== null || !create) {
      return;
    }
    void create(EMPTY_PROSEMIRROR_DOC);
  }, [create, initialContent, isLoading]);

  return (
    <div>
      <p className="text-sm text-muted-foreground font-semibold">Description</p>
      {isLoading ? (
        <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
          Loading editor...
        </div>
      ) : initialContent === null ? (
        <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
          Initializing editor...
        </div>
      ) : (
        <GlobalTiptapEditor
          mode="rich"
          contentType="json"
          value={initialContent}
          extensions={[extension]}
          placeholder="Add description..."
          className="min-h-24 rounded-md border bg-background px-2 py-2"
          editorClassName="min-h-20 px-1 py-1"
        />
      )}
    </div>
  );
}
