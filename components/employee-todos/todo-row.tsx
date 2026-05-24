"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiDeleteBinLine } from "@remixicon/react";
import { TodoInlineEdit } from "./todo-inline-edit";
import type { Todo } from "./types";

export function TodoRow({ todo }: { todo: Todo }) {
  const [flash, setFlash] = useState(false);
  const update = useMutation(api.employeeTodos.update);
  const remove = useMutation(api.employeeTodos.remove);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className={`group flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-accent ${flash ? "bg-yellow-500/10" : ""}`}
    >
      <Checkbox
        checked={todo.isCompleted}
        onCheckedChange={() => update({ todoId: todo._id, body: { isCompleted: !todo.isCompleted } })}
        className="mt-0.5 shrink-0"
      />

      <div className="flex-1 min-w-0 space-y-1">
        <TodoInlineEdit
          todoId={todo._id}
          title={todo.title}
          isCompleted={todo.isCompleted}
          onFlash={() => { setFlash(true); setTimeout(() => setFlash(false), 700); }}
        />
        <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
          {todo.priority}
        </Badge>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => remove({ todoId: todo._id })}
        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
      >
        <RiDeleteBinLine className="size-3.5" />
      </Button>
    </motion.div>
  );
}