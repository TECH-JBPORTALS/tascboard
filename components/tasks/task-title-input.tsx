"use client";

import { cn } from "@/lib/utils";
import { normalizeStaticValue, type Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { Editor, EditorContainer } from "@/components/ui/editor";
import * as React from "react";

type TaskTitleInputProps = {
  onChange: (value: string) => void;
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function TaskTitleInput({
  value,
  onChange,
  onSave,
  placeholder = "Task title",
  className,
  disabled,
}: TaskTitleInputProps) {
  const latestTextRef = React.useRef(value);
  const toPlateValue = React.useCallback((text: string): Value => {
    return [
      {
        type: "p",
        children: [{ text }],
      },
    ];
  }, []);

  const editor = usePlateEditor({
    value: normalizeStaticValue(toPlateValue(value)),
  });

  React.useEffect(() => {
    if (latestTextRef.current === value) return;
    latestTextRef.current = value;
    editor.tf.setValue(normalizeStaticValue(toPlateValue(value)));
  }, [editor, toPlateValue, value]);

  return (
    <Plate
      editor={editor}
      onTextChange={({ text }) => {
        latestTextRef.current = text;
        onChange(text);
      }}
    >
      <EditorContainer>
        <Editor
          variant="fullWidth"
          className={cn(
            "pb-5 pt-0 text-xl leading-tight font-semibold sm:text-2xl",
            className,
          )}
          placeholder={placeholder}
          disabled={disabled}
          onBlur={() => onSave(latestTextRef.current)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSave(latestTextRef.current);
              event.currentTarget.blur();
            }
          }}
        />
      </EditorContainer>
    </Plate>
  );
}
