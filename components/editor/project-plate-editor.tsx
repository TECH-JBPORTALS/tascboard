"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { YjsPlugin } from "@platejs/yjs/react";
import { Plate, usePlateEditor } from "platejs/react";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { RemoteCursorOverlay } from "@/components/ui/remote-cursor-overlay";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMounted } from "@/hooks/use-mounted";
import { authClient } from "@/lib/auth-client";
import { getCollaborationUser } from "@/lib/collaboration";

const DEFAULT_VALUE = [{ type: "p", children: [{ text: "" }] }];

const SAVE_INTERVAL_MS = 3000;

type ProjectPlateEditorProps = {
  projectId: Id<"projects">;
  /** Snapshot from first load only — must not update when Convex syncs saves. */
  initialContent?: unknown;
};

function resolveInitialValue(initialContent: unknown) {
  return Array.isArray(initialContent) && initialContent.length > 0
    ? initialContent
    : DEFAULT_VALUE;
}

export function ProjectPlateEditor({
  projectId,
  initialContent,
}: ProjectPlateEditorProps) {
  const mounted = useMounted();
  const { data: session } = authClient.useSession();
  const updateDocContent = useMutation(api.project.updateDocContent);

  // Seed document once per project; ignore live Convex updates (autosave loop).
  const initialValue = React.useMemo(
    () => resolveInitialValue(initialContent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId],
  );

  const collaborationUser = React.useMemo(
    () =>
      getCollaborationUser(
        session?.user?.name,
        session?.user?.id ?? "anonymous",
      ),
    [session?.user?.id, session?.user?.name],
  );

  const editor = usePlateEditor(
    {
      plugins: [
        ...BasicNodesKit,
        YjsPlugin.configure({
          options: {
            cursors: {
              data: collaborationUser,
            },
            providers: [
              {
                type: "webrtc",
                options: {
                  roomName: projectId,
                  maxConns: 9,
                  signaling: ["wss://signaling.yjs.dev"],
                },
              },
            ],
          },
          render: {
            afterEditable: RemoteCursorOverlay,
          },
        }),
      ],
      // skipInitialization: true,
    },
    [projectId],
  );

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    void editor.getApi(YjsPlugin).yjs.init({
      id: projectId,
      autoSelect: "end",
      value: initialValue,
    });

    const interval = window.setInterval(() => {
      void updateDocContent({
        projectId,
        content: editor.children,
      });
    }, SAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      void updateDocContent({
        projectId,
        content: editor.children,
      });
      editor.getApi(YjsPlugin).yjs.destroy();
    };
  }, [editor, initialValue, mounted, projectId, updateDocContent]);

  return (
    <Plate editor={editor}>
      <EditorContainer variant="default" className="min-h-[60vh] flex-1">
        <Editor variant="default" placeholder="Document your project…" />
      </EditorContainer>
    </Plate>
  );
}
