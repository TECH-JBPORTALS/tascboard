"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTodoPanelStore } from "@/hooks/todo-panel-store";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckSquare,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high";

interface Todo {
  _id: Id<"employeeTodos">;
  title: string;
  description?: string;
  priority: Priority;
  isCompleted: boolean;
  createdAt: number;
}

// ─── Priority helpers ─────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-blue-400",
  medium: "bg-yellow-400",
  high: "bg-red-400",
};

// ─── Single Todo Row ──────────────────────────────────────────────────────────

function TodoRow({
  todo,
  onToggle,
  onDelete,
  onUpdate,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Keep draft in sync if todo.title changes externally
  useEffect(() => {
    if (!editing) setDraft(todo.title);
  }, [todo.title, editing]);

  function startEdit() {
    setDraft(todo.title);
    setEditing(true);
  }

  function handleCommit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === todo.title) {
      setDraft(todo.title);
      setEditing(false);
      return;
    }
    onUpdate(trimmed);
    setEditing(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleCommit();
    if (e.key === "Escape") {
      setDraft(todo.title);
      setEditing(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "group flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-200",
        "hover:bg-white/[0.05]",
        flash && "bg-yellow-400/10",
      )}
    >
      {/* Checkbox */}
      <div className="mt-0.5 shrink-0">
        <Checkbox
          checked={todo.isCompleted}
          onCheckedChange={onToggle}
          className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
      </div>

      {/* Title area */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full bg-transparent text-sm text-white outline-none",
              "border-b border-yellow-400/70 pb-px caret-yellow-400",
            )}
          />
        ) : (
          <span
            onClick={!todo.isCompleted ? startEdit : undefined}
            className={cn(
              "block text-sm leading-snug break-words transition-colors",
              todo.isCompleted
                ? "line-through text-white/30"
                : "text-white/80 hover:text-white cursor-text",
            )}
          >
            {todo.title}
          </span>
        )}

        {/* Priority badge */}
        <span
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize",
            PRIORITY_COLORS[todo.priority],
          )}
        >
          <span
            className={cn("size-1.5 rounded-full", PRIORITY_DOT[todo.priority])}
          />
          {todo.priority}
        </span>
      </div>

      {/* Delete — appears on hover */}
      <button
        onClick={onDelete}
        title="Delete task"
        className={cn(
          "mt-0.5 shrink-0 rounded p-1 opacity-0 transition-all duration-150",
          "group-hover:opacity-100",
          "text-white/30 hover:bg-red-500/20 hover:text-red-400",
        )}
      >
        <Trash2 className="size-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Add Todo Form ────────────────────────────────────────────────────────────

function AddTodoForm({
  employeeId,
}: {
  employeeId: string;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [expanded, setExpanded] = useState(false);
  const createTodo = useMutation(api.employeeTodos.create);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTodo({ employeeId, title: trimmed, priority });
    setTitle("");
    setPriority("medium");
    setExpanded(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setExpanded(false);
      setTitle("");
    }
  }

  return (
    <div className="border-t border-white/[0.06] px-3 pt-2.5 pb-3 shrink-0">
      {/* Priority selector — slides in when input is focused */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 mb-2.5">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 rounded-md border py-1 text-[11px] font-medium capitalize transition-all",
                    priority === p
                      ? PRIORITY_COLORS[p]
                      : "border-white/10 text-white/35 hover:text-white/60 hover:border-white/20",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task… (Enter to save)"
          className={cn(
            "flex-1 bg-white/[0.05] rounded-lg border border-white/[0.08]",
            "px-3 py-2 text-sm text-white placeholder:text-white/25",
            "outline-none focus:border-white/20 focus:bg-white/[0.08]",
            "transition-all",
          )}
        />
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleSubmit}
          disabled={!title.trim()}
          title="Add task"
          className={cn(
            "rounded-lg p-2 transition-all shrink-0",
            title.trim()
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : "bg-white/[0.04] text-white/20 cursor-not-allowed",
          )}
        >
          <Plus className="size-4" />
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function TodoPanel() {
  const { isOpen, toggle, close } = useTodoPanelStore();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const todos = useQuery(
    api.employeeTodos.list,
    userId ? { employeeId: userId } : "skip",
  ) as Todo[] | undefined;

  const updateTodo = useMutation(api.employeeTodos.update);
  const removeTodo = useMutation(api.employeeTodos.remove);

  const pending = todos?.filter((t) => !t.isCompleted) ?? [];
  const completed = todos?.filter((t) => t.isCompleted) ?? [];

  const [showCompleted, setShowCompleted] = useState(false);

  if (!userId) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* ── Expanded Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.91, y: 14 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className={cn(
              // Fixed size — like a proper chat window
              "w-[380px] h-[500px]",
              "rounded-2xl border border-white/[0.09]",
              "bg-[#141414] shadow-2xl shadow-black/70",
              "flex flex-col overflow-hidden",
            )}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white/90 tracking-tight">
                  My Tasks
                </span>
                <AnimatePresence>
                  {pending.length > 0 && (
                    <motion.span
                      key={pending.length}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-medium text-emerald-400"
                    >
                      {pending.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Minimize button */}
              <button
                onClick={close}
                title="Minimize"
                className="rounded-md p-1.5 text-white/40 hover:bg-white/[0.07] hover:text-white/80 transition-colors"
              >
                <ChevronUp className="size-4" />
              </button>
            </div>

            {/* ── Todo List (scrollable) ── */}
            <div className="flex-1 overflow-y-auto px-1 py-1 min-h-0">
              {todos === undefined ? (
                // Loading skeleton
                <div className="flex flex-col gap-2 px-3 py-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 rounded-lg bg-white/[0.04] animate-pulse"
                    />
                  ))}
                </div>
              ) : pending.length === 0 && completed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center pb-8">
                  <CheckSquare className="size-9 text-white/10 mb-2" />
                  <p className="text-sm text-white/30 font-medium">No tasks yet</p>
                  <p className="text-xs text-white/20 mt-0.5">
                    Type below and press Enter to add one
                  </p>
                </div>
              ) : (
                <>
                  {/* Pending todos */}
                  <AnimatePresence mode="popLayout">
                    {pending.map((todo) => (
                      <TodoRow
                        key={todo._id}
                        todo={todo}
                        onToggle={() =>
                          updateTodo({
                            todoId: todo._id,
                            body: { isCompleted: true },
                          })
                        }
                        onDelete={() => removeTodo({ todoId: todo._id })}
                        onUpdate={(title) =>
                          updateTodo({ todoId: todo._id, body: { title } })
                        }
                      />
                    ))}
                  </AnimatePresence>

                  {/* Completed section — collapsible */}
                  {completed.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowCompleted((v) => !v)}
                        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors rounded-md hover:bg-white/[0.03]"
                      >
                        {showCompleted ? (
                          <ChevronDown className="size-3" />
                        ) : (
                          <ChevronDown className="size-3 -rotate-90" />
                        )}
                        {completed.length} completed
                      </button>

                      <AnimatePresence>
                        {showCompleted && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <AnimatePresence mode="popLayout">
                              {completed.map((todo) => (
                                <TodoRow
                                  key={todo._id}
                                  todo={todo}
                                  onToggle={() =>
                                    updateTodo({
                                      todoId: todo._id,
                                      body: { isCompleted: false },
                                    })
                                  }
                                  onDelete={() =>
                                    removeTodo({ todoId: todo._id })
                                  }
                                  onUpdate={(title) =>
                                    updateTodo({
                                      todoId: todo._id,
                                      body: { title },
                                    })
                                  }
                                />
                              ))}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Add Todo ── */}
            <AddTodoForm employeeId={userId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Bubble ── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggle}
        title={isOpen ? "Minimize tasks" : "My Tasks"}
        className={cn(
          "relative flex size-12 items-center justify-center rounded-full shadow-xl",
          "transition-colors duration-200",
          isOpen
            ? "bg-[#1e1e1e] border border-white/10 text-white/60"
            : "bg-emerald-500 text-white shadow-emerald-500/40",
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <X className="size-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <CheckSquare className="size-5" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pending count badge */}
        <AnimatePresence>
          {!isOpen && pending.length > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                "absolute -top-1 -right-1 flex size-4 items-center justify-center",
                "rounded-full bg-white text-[10px] font-bold text-emerald-600",
              )}
            >
              {pending.length > 9 ? "9+" : pending.length}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}