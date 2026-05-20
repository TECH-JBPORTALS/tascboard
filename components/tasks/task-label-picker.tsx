"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { RiAddLine, RiPriceTag3Line } from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useActor } from "@/hooks/use-actor";
import { DEFAULT_LABEL_COLOR, LABEL_COLOR_OPTIONS } from "@/lib/label-colors";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type TaskLabelPickerProps = {
  taskId: Id<"tasks">;
  projectId: Id<"projects">;
  projectName: string;
  attachedLabels: Doc<"labels">[];
};

function LabelDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}

export function TaskLabelPicker({
  taskId,
  projectId,
  projectName,
  attachedLabels,
}: TaskLabelPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const { deviceName } = useActor();

  const projectLabels = useQuery(api.label.listByProject, { projectId });
  const createLabel = useMutation(api.label.create);
  const attachLabel = useMutation(api.label.attachToTask);
  const detachLabel = useMutation(api.label.detachFromTask);

  const attachedIds = new Set(attachedLabels.map((l) => l._id));
  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();

  const filtered =
    projectLabels?.filter((label) =>
      label.name.toLowerCase().includes(normalized),
    ) ?? [];

  const exactMatch = projectLabels?.some(
    (label) => label.name.toLowerCase() === normalized,
  );

  async function handleToggle(label: Doc<"labels">) {
    if (attachedIds.has(label._id)) {
      await detachLabel({ taskId, labelId: label._id, deviceName });
    } else {
      await attachLabel({ taskId, labelId: label._id, deviceName });
    }
  }

  async function handleCreate(name: string, color: string) {
    const labelId = await createLabel({ projectId, name, color });
    await attachLabel({ taskId, labelId, deviceName });
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {attachedLabels.map((label) => (
          <button
            key={label._id}
            type="button"
            onClick={() => void handleToggle(label)}
            className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 text-xs text-foreground hover:bg-muted"
          >
            <LabelDot color={label.color} />
            {label.name}
          </button>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full justify-start gap-1.5 font-normal text-muted-foreground"
            />
          }
        >
          <RiPriceTag3Line className="size-3.5" />
          Add label
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Add labels…"
              value={query}
              onValueChange={setQuery}
              className="h-9 border-0"
            />
            <CommandList>
              <CommandEmpty>No labels found</CommandEmpty>
              <CommandGroup>
                {filtered.map((label) => (
                  <CommandItem
                    key={label._id}
                    value={label.name}
                    onSelect={() => void handleToggle(label)}
                  >
                    <LabelDot color={label.color} />
                    <span className="flex-1">{label.name}</span>
                    {attachedIds.has(label._id) ? (
                      <span className="text-xs text-muted-foreground">Added</span>
                    ) : null}
                  </CommandItem>
                ))}
                {trimmed && !exactMatch ? (
                  <CommandItem
                    value={`create-${trimmed}`}
                    onSelect={() =>
                      void handleCreate(trimmed, DEFAULT_LABEL_COLOR)
                    }
                    className="bg-muted/50"
                  >
                    <RiAddLine className="size-3.5 text-muted-foreground" />
                    <span className="flex-1 text-sm">
                      Create new {projectName} label:{" "}
                      <span className="text-muted-foreground">&quot;{trimmed}&quot;</span>
                    </span>
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
