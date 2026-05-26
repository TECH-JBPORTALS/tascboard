"use client";

import * as React from "react";
import { addDays, endOfWeek, format, startOfDay } from "date-fns";
import { RiCalendarLine, RiCalendarCloseLine } from "@remixicon/react";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

type DueDatePreset = {
  id: string;
  label: string;
  getDate: () => Date;
  shortcut?: string;
};

function buildPresets(): DueDatePreset[] {
  const today = startOfDay(new Date());

  return [
    {
      id: "tomorrow",
      label: "Tomorrow",
      shortcut: "1",
      getDate: () => addDays(today, 1),
    },
    {
      id: "end-of-week",
      label: "End of this week",
      shortcut: "2",
      getDate: () => endOfWeek(today, { weekStartsOn: 1 }),
    },
    {
      id: "one-week",
      label: "In one week",
      shortcut: "3",
      getDate: () => addDays(today, 7),
    },
  ];
}

type TaskDueDatePickerBaseProps = {
  dueDate?: number | null;
  trigger: React.ReactElement;
  className?: string;
  align?: "start" | "center" | "end";
  /** When set, overrides the distinct-due check (e.g. create-task form). */
  hasDueDate?: boolean;
};

type TaskDueDatePickerProps = TaskDueDatePickerBaseProps &
  (
    | {
        taskId: Id<"tasks">;
        onSelect?: (date: Date) => void;
        onClear?: () => void;
      }
    | {
        taskId?: undefined;
        onSelect: (date: Date) => void;
        onClear?: () => void;
      }
  );

export function TaskDueDatePicker({
  dueDate,
  trigger,
  className,
  align = "end",
  hasDueDate: hasDueDateProp,
  ...mode
}: TaskDueDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [calendarDate, setCalendarDate] = React.useState<Date>(() =>
    dueDate != null ? new Date(dueDate) : new Date(),
  );
  const updateTaskMutation = useMutation(api.task.update);

  const presets = buildPresets();
  const hasDueDate = hasDueDateProp ?? dueDate != null;

  const applyDate = async (date: Date) => {
    if (mode.onSelect) {
      mode.onSelect(date);
    } else if (mode.taskId) {
      await updateTaskMutation({
        taskId: mode.taskId,
        body: { dueDate: startOfDay(date).getTime() },
      });
    }
    setOpen(false);
    setShowCalendar(false);
  };

  const clearDueDate = async () => {
    if (mode.onClear) {
      mode.onClear();
    } else if (mode.taskId) {
      await updateTaskMutation({
        taskId: mode.taskId,
        body: { dueDate: null },
      });
    }
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setCalendarDate(dueDate != null ? new Date(dueDate) : new Date());
      setShowCalendar(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className={cn("w-64 p-0", className)}
        align={align}
        sideOffset={4}
      >
        {showCalendar ? (
          <Calendar
            className="w-full"
            mode="single"
            selected={calendarDate}
            onSelect={(date) => {
              if (!date) return;
              setCalendarDate(date);
              void applyDate(date);
            }}
          />
        ) : (
          <Command>
            <CommandInput
              placeholder="Try: tomorrow, 7 days…"
              className="h-8 border-0 bg-transparent shadow-none"
            />
            <CommandList>
              <CommandEmpty>No matching date</CommandEmpty>
              <CommandGroup>
                {hasDueDate && (
                  <CommandItem
                    value="remove due date"
                    onSelect={() => void clearDueDate()}
                  >
                    <RiCalendarCloseLine className="size-3.5 text-muted-foreground" />
                    <span className="flex-1">Remove due date</span>
                  </CommandItem>
                )}
                <CommandItem
                  value="custom date picker"
                  onSelect={() => setShowCalendar(true)}
                >
                  <RiCalendarLine className="size-3.5 text-muted-foreground" />
                  <span className="flex-1">Custom…</span>
                </CommandItem>
                {presets.map((preset) => {
                  const date = preset.getDate();
                  return (
                    <CommandItem
                      key={preset.id}
                      value={`${preset.label} ${format(date, "MMM d")}`}
                      onSelect={() => void applyDate(date)}
                    >
                      <RiCalendarLine className="size-3.5 text-muted-foreground" />
                      <span className="flex-1">{preset.label}</span>
                      <CommandShortcut>
                        {format(date, "EEE, d MMM")}
                      </CommandShortcut>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
        {showCalendar ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowCalendar(false)}
            >
              Back
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
