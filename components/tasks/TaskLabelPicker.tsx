"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { RiAddFill, RiArrowGoBackLine } from "@remixicon/react";
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
  const [pendingCreateName, setPendingCreateName] = React.useState<
    string | null
  >(null);
  const [createColor, setCreateColor] =
    React.useState<string>(DEFAULT_LABEL_COLOR);
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
    setPendingCreateName(null);
    setCreateColor(DEFAULT_LABEL_COLOR);
    setOpen(false);
  }

  function handleCreateStep(name: string) {
    setPendingCreateName(name);
  }

  async function handleSelectCreateColor(color: string) {
    if (!pendingCreateName) return;
    setCreateColor(color);
    await handleCreate(pendingCreateName, color);
  }

  function formatColorName(name: string) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return (
    <div className="space-x-1 flex">
      <div className="flex flex-wrap gap-1.5">
        {attachedLabels.map((label) => (
          <Button
            key={label._id}
            type="button"
            variant={"outline"}
            size={"xs"}
            className="rounded-full"
            onClick={() => void handleToggle(label)}
          >
            <LabelDot color={label.color} />
            {label.name}
          </Button>
        ))}
      </div>

      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setPendingCreateName(null);
            setCreateColor(DEFAULT_LABEL_COLOR);
          }
        }}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size={attachedLabels.length > 0 ? "icon-xs" : "xs"}
              className="rounded-full"
            />
          }
        >
          <RiAddFill className="size-3.5" />
          {attachedLabels.length === 0 && "Add label"}
        </PopoverTrigger>

        <PopoverContent className="w-fit p-0" align="end">
          <Command shouldFilter={false} className="w-fit min-w-64 max-w-96">
            <CommandInput
              placeholder="Add labels…"
              value={query}
              onValueChange={setQuery}
              className="h-9 border-0"
            />
            <CommandList>
              <CommandEmpty>No labels found</CommandEmpty>
              {pendingCreateName ? (
                <CommandGroup
                  heading={`Pick a color for "${pendingCreateName}"`}
                >
                  {LABEL_COLOR_OPTIONS.map((color) => (
                    <CommandItem
                      key={color.id}
                      value={`color-${color.id}`}
                      onSelect={() => void handleSelectCreateColor(color.value)}
                    >
                      <LabelDot color={color.value} className="size-2.5" />
                      <span className="flex-1">
                        {formatColorName(color.id)}
                      </span>
                      {createColor === color.value ? (
                        <span className="text-xs text-muted-foreground">
                          Selected
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                  <CommandItem
                    value="create-back"
                    onSelect={() => setPendingCreateName(null)}
                    className="text-xs text-muted-foreground"
                  >
                    <RiArrowGoBackLine className={"size-2.5"} /> Back
                  </CommandItem>
                </CommandGroup>
              ) : (
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
                        <span className="text-xs text-muted-foreground">
                          Added
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                  {trimmed && !exactMatch ? (
                    <CommandItem
                      value={`create-${trimmed}`}
                      onSelect={() => handleCreateStep(trimmed)}
                      className="bg-muted/50 overflow-hidden"
                    >
                      <LabelDot color={createColor} className="size-2.5" />
                      <span className="flex-1 text-nowrap text-xs">
                        Create new{" "}
                        <span className="font-semibold">{projectName}</span>{" "}
                        label:{" "}
                        <span className="text-muted-foreground font-semibold">
                          &quot;{trimmed}&quot;
                        </span>
                      </span>
                    </CommandItem>
                  ) : null}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
