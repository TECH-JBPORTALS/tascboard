"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";

interface Props {
  todoId: Id<"employeeTodos">;
  title: string;
  isCompleted: boolean;
  onFlash: () => void;
}

export function TodoInlineEdit({ todoId, title, isCompleted, onFlash }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useMutation(api.employeeTodos.update);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  async function handleCommit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setDraft(title);
      setEditing(false);
      return;
    }
    await update({ todoId, body: { title: trimmed } });
    setEditing(false);
    onFlash();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleCommit();
    if (e.key === "Escape") { setDraft(title); setEditing(false); }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className="h-6 px-1.5 py-0 text-sm"
      />
    );
  }

  return (
    <p
      onClick={() => { if (!isCompleted) setEditing(true); }}
      className={isCompleted ? "text-sm line-through text-muted-foreground" : "text-sm cursor-text"}
    >
      {title}
    </p>
  );
}