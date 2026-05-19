"use client";

import * as React from "react";
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
  PROJECT_COLORS,
  PROJECT_ICONS,
  type ProjectColorId,
} from "@/lib/project-appearance";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProjectIcon } from "@/components/projects/project-icon";

type ProjectIconPickerProps = {
  icon: string;
  color: ProjectColorId;
  onIconChange: (icon: string) => void;
  onColorChange: (color: ProjectColorId) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
};

export function ProjectIconPicker({
  icon,
  color,
  onIconChange,
  onColorChange,
  size = "lg",
  disabled,
}: ProjectIconPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
      >
        <ProjectIcon icon={icon} color={color} size={size} />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Color</p>
        <div className="mb-3 grid grid-cols-8 gap-1.5">
          {PROJECT_COLORS.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onColorChange(item.id)}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-sm transition-opacity",
                item.className,
                color === item.id
                  ? "ring-2 ring-foreground/60 ring-offset-2 ring-offset-popover"
                  : "opacity-80 hover:opacity-100",
              )}
            >
              {icon}
            </button>
          ))}
        </div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Icon</p>
        <div className="grid grid-cols-8 gap-1">
          {PROJECT_ICONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onIconChange(item);
                setOpen(false);
              }}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-base hover:bg-muted",
                icon === item && "bg-muted ring-1 ring-border",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function useProjectIconPickerState(
  initialIcon = DEFAULT_PROJECT_ICON,
  initialColor: ProjectColorId = DEFAULT_PROJECT_COLOR,
) {
  const [icon, setIcon] = React.useState<string>(initialIcon);
  const [color, setColor] = React.useState<ProjectColorId>(initialColor);

  return { icon, color, setIcon, setColor };
}
