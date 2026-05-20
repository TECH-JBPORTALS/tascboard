"use client";

import * as React from "react";
import { Plate, usePlateEditor } from "platejs/react";
import {
  RiCodeBlock,
  RiDoubleQuotesL,
  RiH1,
  RiH2,
  RiH3,
  RiImageLine,
  RiListCheck2,
  RiListOrdered2,
  RiListUnordered,
  RiSeparator,
} from "@remixicon/react";
import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { PLATE_DEFAULT_VALUE, resolvePlateValue } from "@/lib/plate-content";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 800;

type TaskPlateEditorProps = {
  /** Stable key — when this changes, editor re-seeds from `initialContent`. */
  editorKey: string;
  initialContent?: unknown;
  onSave: (value: unknown) => void | Promise<void>;
  placeholder?: string;
  variant?: "default" | "comment";
  className?: string;
  readOnly?: boolean;
  onSubmit?: (value: unknown) => void | Promise<void>;
};

type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

type SlashEditorApi = {
  insertText?: (text: string) => void;
  tf?: {
    h1?: { toggle: () => void };
    h2?: { toggle: () => void };
    h3?: { toggle: () => void };
    blockquote?: { toggle: () => void };
    insertText?: (text: string) => void;
  };
};

export function TaskPlateEditor({
  editorKey,
  initialContent,
  onSave,
  placeholder = "Add description…",
  variant = "default",
  className,
  readOnly = false,
  onSubmit,
}: TaskPlateEditorProps) {
  const onSaveRef = React.useRef(onSave);
  const timeoutRef = React.useRef<number | null>(null);
  const [slashOpen, setSlashOpen] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState("");
  React.useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const initialValue = React.useMemo(
    () => resolvePlateValue(initialContent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorKey],
  );

  const editor = usePlateEditor(
    {
      plugins: BasicNodesKit,
      value: initialValue,
    },
    [editorKey],
  );

  const flushSave = React.useCallback(async () => {
    await onSaveRef.current(editor.children);
  }, [editor]);

  const scheduleSave = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      void flushSave();
    }, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  const editorApi = editor as unknown as SlashEditorApi;

  const insertText = React.useCallback(
    (text: string) => {
      if (editorApi.tf?.insertText) {
        editorApi.tf.insertText(text);
        return;
      }
      editorApi.insertText?.(text);
    },
    [editorApi],
  );

  const slashCommands = React.useMemo<SlashCommand[]>(
    () => [
      {
        id: "heading-1",
        label: "Heading 1",
        hint: "H1",
        icon: RiH1,
        run: () => {
          editorApi.tf?.h1?.toggle();
        },
      },
      {
        id: "heading-2",
        label: "Heading 2",
        hint: "H2",
        icon: RiH2,
        run: () => {
          editorApi.tf?.h2?.toggle();
        },
      },
      {
        id: "heading-3",
        label: "Heading 3",
        hint: "H3",
        icon: RiH3,
        run: () => {
          editorApi.tf?.h3?.toggle();
        },
      },
      {
        id: "bullet-list",
        label: "Bulleted list",
        hint: "-",
        icon: RiListUnordered,
        run: () => {
          insertText("- ");
        },
      },
      {
        id: "number-list",
        label: "Numbered list",
        hint: "1.",
        icon: RiListOrdered2,
        run: () => {
          insertText("1. ");
        },
      },
      {
        id: "checklist",
        label: "Checklist",
        hint: "[ ]",
        icon: RiListCheck2,
        run: () => {
          insertText("- [ ] ");
        },
      },
      {
        id: "blockquote",
        label: "Blockquote",
        hint: ">",
        icon: RiDoubleQuotesL,
        run: () => {
          editorApi.tf?.blockquote?.toggle();
        },
      },
      {
        id: "code-block",
        label: "Code block",
        hint: "```",
        icon: RiCodeBlock,
        run: () => {
          insertText("```\n\n```");
        },
      },
      {
        id: "divider",
        label: "Divider",
        hint: "---",
        icon: RiSeparator,
        run: () => {
          insertText("\n---\n");
        },
      },
      {
        id: "image",
        label: "Insert image URL",
        hint: "https://",
        icon: RiImageLine,
        run: () => {
          const url = window.prompt("Paste image URL");
          if (!url) return;
          insertText(`![image](${url.trim()})`);
        },
      },
    ],
    [editorApi, insertText],
  );

  const filteredSlashCommands = React.useMemo(() => {
    const query = slashQuery.trim().toLowerCase();
    if (!query) return slashCommands;
    return slashCommands.filter((command) => {
      const haystack = `${command.label} ${command.hint}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [slashCommands, slashQuery]);

  React.useEffect(() => {
    if (readOnly) return;

    scheduleSave();
    const interval = window.setInterval(scheduleSave, SAVE_DEBOUNCE_MS * 2);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      window.clearInterval(interval);
      void flushSave();
    };
  }, [flushSave, readOnly, scheduleSave]);

  return (
    <Plate editor={editor} readOnly={readOnly}>
      <EditorContainer
        variant={variant === "comment" ? "comment" : "default"}
        className={cn(
          "relative",
          variant === "default" && "min-h-[120px] w-full",
          variant === "comment" && "min-h-[40px] w-full",
          className,
        )}
      >
        {slashOpen ? (
          <div className="absolute left-3 top-3 z-20 w-72 rounded-lg border border-border/80 bg-background shadow-lg">
            <Command>
              <CommandInput
                autoFocus
                value={slashQuery}
                onValueChange={setSlashQuery}
                placeholder="Insert node…"
              />
              <CommandList>
                <CommandEmpty>No matches</CommandEmpty>
                <CommandGroup heading="Basic blocks">
                  {filteredSlashCommands.map((command) => (
                    <CommandItem
                      key={command.id}
                      value={`${command.label} ${command.hint}`}
                      onSelect={() => {
                        command.run();
                        setSlashOpen(false);
                        setSlashQuery("");
                      }}
                    >
                      <command.icon className="size-4 text-muted-foreground" />
                      <span>{command.label}</span>
                      <CommandShortcut>{command.hint}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        ) : null}
        <Editor
          variant={variant === "comment" ? "comment" : "default"}
          className={cn(
            variant === "default" && "text-sm sm:px-0!",
            variant === "comment" && "text-sm",
          )}
          placeholder={placeholder}
          readOnly={readOnly}
          onKeyDown={(event) => {
            if (!readOnly && !slashOpen && event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
              event.preventDefault();
              setSlashOpen(true);
              setSlashQuery("");
              return;
            }
            if (slashOpen && event.key === "Escape") {
              event.preventDefault();
              setSlashOpen(false);
              setSlashQuery("");
              return;
            }
            if (!onSubmit || readOnly) return;
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              const nextValue = editor.children;
              void (async () => {
                await onSaveRef.current(nextValue);
                await onSubmit(nextValue);
              })();
            }
          }}
        />
      </EditorContainer>
    </Plate>
  );
}

export { PLATE_DEFAULT_VALUE };
