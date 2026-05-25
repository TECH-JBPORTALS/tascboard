"use client";

import * as React from "react";
import type {
  AnyExtension,
  Editor as TiptapEditor,
  JSONContent,
} from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  RiBold,
  RiCodeBlock,
  RiCodeLine,
  RiDoubleQuotesL,
  RiH1,
  RiH2,
  RiH3,
  RiItalic,
  RiListOrdered,
  RiListUnordered,
  RiParagraph,
  RiStrikethrough,
  RiUnderline,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditorValue = string | JSONContent;
type EditorContentType = "markdown" | "json" | "text";

type GlobalTiptapEditorProps = {
  value?: EditorValue | null;
  onChange?: (value: EditorValue) => void;
  onSave?: (value: EditorValue) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  disabled?: boolean;
  singleLine?: boolean;
  blurOnEnter?: boolean;
  onEnter?: (value: EditorValue) => void;
  editorAriaLabel?: string;
  mode?: "rich" | "title";
  contentType?: EditorContentType;
  extensions?: AnyExtension[];
};

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function resolveContentType(
  mode: "rich" | "title",
  contentType?: EditorContentType,
): EditorContentType {
  if (contentType) return contentType;
  return mode === "title" ? "text" : "markdown";
}

function textToDoc(value: string): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: value ? [{ type: "text", text: value }] : [],
      },
    ],
  };
}

function normalizeValue(
  value: EditorValue | null | undefined,
  contentType: EditorContentType,
): EditorValue {
  if (contentType === "json") {
    return value && typeof value === "object" ? value : EMPTY_DOC;
  }

  if (contentType === "text") {
    return textToDoc(typeof value === "string" ? value : "");
  }

  return typeof value === "string" ? value : "";
}

function comparableValue(value: EditorValue): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function serializeValue(
  editor: TiptapEditor,
  contentType: EditorContentType,
): EditorValue {
  if (contentType === "json") return editor.getJSON();

  if (contentType === "text") {
    return editor.getText().replace(/\n+/g, " ");
  }

  const markdownEditor = editor as TiptapEditor & {
    getMarkdown?: () => string;
  };

  if (typeof markdownEditor.getMarkdown === "function") {
    return markdownEditor.getMarkdown();
  }

  return editor.getText();
}

export function GlobalTiptapEditor({
  value,
  onChange,
  onSave,
  mode = "rich",
  placeholder = "Write something...",
  className,
  editorClassName,
  disabled,
  singleLine,
  blurOnEnter,
  onEnter,
  editorAriaLabel,
  contentType,
  extensions: extraExtensions,
}: GlobalTiptapEditorProps) {
  const resolvedContentType = resolveContentType(mode, contentType);
  const normalizedValue = React.useMemo(
    () => normalizeValue(value, resolvedContentType),
    [value, resolvedContentType],
  );
  const latestValueRef = React.useRef<EditorValue>(normalizedValue);
  const extensions = React.useMemo<AnyExtension[]>(() => {
    const isTitle = mode === "title";
    const built: AnyExtension[] = [
      StarterKit.configure({
        blockquote: isTitle ? false : undefined,
        bold: isTitle ? false : undefined,
        bulletList: isTitle ? false : undefined,
        code: isTitle ? false : undefined,
        codeBlock: isTitle ? false : undefined,
        hardBreak: isTitle ? false : undefined,
        heading: isTitle
          ? false
          : {
              levels: [1, 2, 3],
            },
        horizontalRule: isTitle ? false : undefined,
        italic: isTitle ? false : undefined,
        orderedList: isTitle ? false : undefined,
        strike: isTitle ? false : undefined,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:text-muted-foreground before:content-[attr(data-placeholder)] before:pointer-events-none before:float-left before:h-0",
      }),
    ];

    if (!isTitle) {
      built.push(Underline);
    }
    if (resolvedContentType === "markdown") {
      built.push(Markdown);
    }
    if (extraExtensions?.length) {
      built.push(...extraExtensions);
    }

    return built;
  }, [extraExtensions, mode, placeholder, resolvedContentType]);

  const editor = useEditor({
    content: normalizedValue,
    contentType: resolvedContentType === "markdown" ? "markdown" : "json",
    extensions,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (!singleLine || event.key !== "Enter") return false;
        event.preventDefault();
        const nextValue = latestValueRef.current;
        onEnter?.(nextValue);
        if (blurOnEnter) {
          (view.dom as HTMLElement).blur();
        }
        return true;
      },
      attributes: {
        class: cn(
          "focus-visible:outline-none min-h-0",
          mode === "title" &&
            "font-semibold text-xl sm:text-2xl leading-tight tracking-tight",
          mode !== "title" &&
            [
              "text-sm leading-relaxed",
              "[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:my-3",
              "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:my-2.5",
              "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:my-2",
              "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2",
              "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2",
              "[&_li]:my-1",
              "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2",
            ].join(" "),
          editorClassName,
        ),
        "aria-label": editorAriaLabel ?? placeholder,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = serializeValue(currentEditor, resolvedContentType);
      latestValueRef.current = nextValue;
      onChange?.(nextValue);
    },
    onBlur: ({ editor: currentEditor }) => {
      const nextValue = serializeValue(currentEditor, resolvedContentType);
      latestValueRef.current = nextValue;
      onSave?.(nextValue);
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  React.useEffect(() => {
    if (!editor) return;
    const nextValue = normalizeValue(value, resolvedContentType);
    const currentValue = serializeValue(editor, resolvedContentType);
    if (comparableValue(nextValue) === comparableValue(currentValue)) return;

    editor.commands.setContent(nextValue, {
      emitUpdate: false,
      contentType: resolvedContentType === "markdown" ? "markdown" : "json",
    });
    latestValueRef.current = nextValue;
  }, [editor, value, resolvedContentType]);

  if (!editor) return null;
  const canShowBubble = mode === "rich" && !disabled;

  return (
    <div
      className={cn(
        "relative rounded-md border border-transparent bg-transparent px-1 py-1",
        disabled && "opacity-70",
        className,
      )}
    >
      {canShowBubble ? (
        <BubbleMenu
          editor={editor}
          options={{ placement: "top", strategy: "absolute", inline: true }}
          shouldShow={({ editor: bubbleEditor }) =>
            bubbleEditor.isFocused && !bubbleEditor.state.selection.empty
          }
          className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-lg"
        >
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <RiBold />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <RiItalic />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
          >
            <RiUnderline />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
          >
            <RiStrikethrough />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleCode().run()}
            aria-label="Inline code"
          >
            <RiCodeLine />
          </Button>
          <span className="mx-1 h-4 w-px bg-border" />
          <Button
            type="button"
            variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().setParagraph().run()}
            aria-label="Paragraph"
          >
            <RiParagraph />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
            }
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            aria-label="Heading 1"
          >
            <RiH1 />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
            }
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            aria-label="Heading 2"
          >
            <RiH2 />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
            }
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            aria-label="Heading 3"
          >
            <RiH3 />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <RiListUnordered />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered list"
          >
            <RiListOrdered />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Blockquote"
          >
            <RiDoubleQuotesL />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
            size="icon-sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            aria-label="Code block"
          >
            <RiCodeBlock />
          </Button>
        </BubbleMenu>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
