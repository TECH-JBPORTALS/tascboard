"use client";

import { normalizeStaticValue, Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { SlashKit } from "./plugins/slash-kit";
import { ListKit } from "./plugins/list-kit";
import { ToggleKit } from "./plugins/toggle-kit";
import { CodeBlockKit } from "./plugins/code-block-kit";

export function PlateEditor({
  value,
  ...props
}: Omit<React.ComponentProps<typeof Plate>, "editor" | "children"> & {
  value: Value;
}) {
  const editor = usePlateEditor({
    plugins: [
      ...BasicNodesKit,
      ...SlashKit,
      ...ListKit,
      ...ToggleKit,
      ...CodeBlockKit,
    ],
    value: normalizeStaticValue(value),
  });

  return (
    <Plate {...props} editor={editor}>
      <EditorContainer>
        <Editor variant="fullWidth" placeholder="Add description..." />
      </EditorContainer>
    </Plate>
  );
}
