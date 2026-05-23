"use client";

import * as React from "react";
import { normalizeStaticValue, type Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { MarkdownPlugin, deserializeMd, serializeMd } from "@platejs/markdown";

import { Editor, EditorContainer } from "@/components/ui/editor";
import { SlashKit } from "./plugins/slash-kit";
import { ListKit } from "./plugins/list-kit";
import { ToggleKit } from "./plugins/toggle-kit";
import { CodeBlockKit } from "./plugins/code-block-kit";
import { BasicBlocksKit } from "./plugins/basic-blocks-kit";

const EMPTY_VALUE: Value = [{ type: "p", children: [{ text: "" }] }];

type PlateEditorProps = {
  value?: string;
  onChange?: (markdown: string) => void;
  onSave?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function PlateEditor({
  value,
  onChange,
  onSave,
  placeholder = "Add description...",
  className,
  disabled,
}: PlateEditorProps) {
  const markdownValue = value ?? "";
  const latestMarkdownRef = React.useRef(markdownValue);
  const editor = usePlateEditor({
    plugins: [
      ...BasicBlocksKit,
      ...SlashKit,
      ...ListKit,
      ...ToggleKit,
      ...CodeBlockKit,
      MarkdownPlugin,
    ],
    value: normalizeStaticValue(EMPTY_VALUE),
  });

  React.useEffect(() => {
    if (latestMarkdownRef.current === markdownValue) return;
    latestMarkdownRef.current = markdownValue;
    const nextValue = normalizeStaticValue(
      deserializeMd(editor, markdownValue),
    );
    editor.tf.setValue(nextValue);
  }, [editor, markdownValue]);

  React.useEffect(() => {
    if (!markdownValue) return;
    const nextValue = normalizeStaticValue(
      deserializeMd(editor, markdownValue),
    );
    editor.tf.setValue(nextValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return (
    <Plate
      editor={editor}
      onChange={() => {
        const markdown = serializeMd(editor);
        latestMarkdownRef.current = markdown;
        onChange?.(markdown);
      }}
    >
      <EditorContainer>
        <Editor
          variant="fullWidth"
          className={className ?? "pb-7"}
          placeholder={placeholder}
          disabled={disabled}
          onBlur={() => onSave?.(latestMarkdownRef.current)}
        />
      </EditorContainer>
    </Plate>
  );
}
