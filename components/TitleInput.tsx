"use client";

import { cn } from "@/lib/utils";
import { normalizeStaticValue, type Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { Editor, EditorContainer } from "@/components/ui/editor";
import * as React from "react";

type TaskTitleInputProps = {
  onChange?: (value: string) => void;
  value?: string;
  onSave?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  blurOnSave?: boolean;
} & React.ComponentProps<typeof Editor>;

export function TitleInput({
  value,
  onChange,
  onSave,
  placeholder = "Enter title",
  className,
  disabled,
  blurOnSave = true,
  ...editorProps
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
    value: normalizeStaticValue(toPlateValue(value ?? "")),
  });

  React.useEffect(() => {
    if (latestTextRef.current === value) return;
    latestTextRef.current = value;
    editor.tf.setValue(normalizeStaticValue(toPlateValue(value ?? "")));
  }, [editor, toPlateValue, value]);

  return (
    <Plate
      editor={editor}
      onTextChange={({ text }) => {
        latestTextRef.current = text;
        onChange?.(text);
      }}
    >
      <EditorContainer className="h-fit overflow-y-hidden">
        <Editor
          {...editorProps}
          variant="fullWidth"
          className={cn(
            "pb-5 pt-0 text-xl h-fit leading-tight font-semibold sm:text-2xl",
            className,
          )}
          placeholder={placeholder}
          disabled={disabled}
          onBlur={() =>
            blurOnSave ? onSave?.(latestTextRef.current ?? "") : undefined
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSave?.(latestTextRef.current ?? "");
              event.currentTarget.blur();
            }
          }}
        />
      </EditorContainer>
    </Plate>
  );
}
