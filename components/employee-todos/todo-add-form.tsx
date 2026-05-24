"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RiAddLine } from "@remixicon/react";
import type { Priority } from "./types";

export function TodoAddForm({ employeeId }: { employeeId: string }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [expanded, setExpanded] = useState(false);
  const create = useMutation(api.employeeTodos.create);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    await create({ employeeId, title: trimmed, priority });
    setTitle("");
    setPriority("medium");
    setExpanded(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") { setExpanded(false); setTitle(""); }
  }

  return (
    <div className="shrink-0">
      <Separator />
      <div className="px-3 pt-2.5 pb-3 space-y-2">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="overflow-hidden"
            >
              <div className="flex gap-1.5 pb-1">
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <Button
                    key={p}
                    variant={priority === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className="flex-1 h-7 text-xs capitalize"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task… (Enter to save)"
          />
          <Button
            size="icon"
            variant={title.trim() ? "default" : "ghost"}
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            <RiAddLine className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}