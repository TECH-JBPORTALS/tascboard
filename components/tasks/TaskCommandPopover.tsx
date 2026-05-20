"use client";

import * as React from "react";
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
import { cn } from "@/lib/utils";

export type TaskCommandOption<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  keywords?: string;
};

type TaskCommandPopoverProps<T extends string> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  placeholder: string;
  shortcutKey?: string;
  options: TaskCommandOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  align?: "start" | "center" | "end";
  className?: string;
  emptyMessage?: string;
};

export function TaskCommandPopover<T extends string>({
  open,
  onOpenChange,
  trigger,
  placeholder,
  options,
  value,
  onSelect,
  align = "start",
  className,
  emptyMessage = "No results",
}: TaskCommandPopoverProps<T>) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        className={cn("w-56 p-0", className)}
        align={align}
        sideOffset={4}
      >
        <Command>
          <CommandInput
            placeholder={placeholder}
            className="h-8 border-0 bg-transparent shadow-none"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.keywords ?? ""}`}
                  data-checked={value === option.value}
                  onSelect={() => {
                    onSelect(option.value);
                    onOpenChange(false);
                  }}
                >
                  {option.icon}
                  <span className="flex-1">{option.label}</span>
                  {option.shortcut ? (
                    <CommandShortcut>{option.shortcut}</CommandShortcut>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
