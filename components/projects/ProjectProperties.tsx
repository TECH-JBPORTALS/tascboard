"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { format, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  RiCalendarLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiStopCircleLine,
} from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { ProjectMangerPicker } from "./ProjectManagerPicker";
import { ProjectMembersPicker } from "./ProjectMembersPicker";

type ProjectStatus = Doc<"projects">["status"];

const statusOptions: {
  value: ProjectStatus;
  label: string;
  icon: typeof RiPauseCircleLine;
  iconColor: string;
}[] = [
  {
    value: "inactive",
    label: "Inactive",
    icon: RiPauseCircleLine,
    iconColor: "var(--color-muted-foreground)",
  },
  {
    value: "active",
    label: "Active",
    icon: RiPlayCircleLine,
    iconColor: "var(--color-primary)",
  },
  {
    value: "terminated",
    label: "Terminated",
    icon: RiStopCircleLine,
    iconColor: "var(--color-destructive)",
  },
];

type ProjectPropertiesProps = Pick<
  NonNullable<typeof api.project.get._returnType>,
  "_id" | "startDate" | "endDate" | "status" | "manager" | "members"
>;

function PropertyTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 gap-1.5 px-2 font-normal text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ProjectProperties({
  _id: projectId,
  startDate,
  endDate,
  manager,
  status,
}: ProjectPropertiesProps) {
  const updateProject = useMutation(api.project.update);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);

  const currentStatus = statusOptions.find((item) => item.value === status)!;
  const StatusIcon = currentStatus.icon;
  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);
  const [selectedRange, setSelectedRange] = React.useState<
    DateRange | undefined
  >();

  const handleDateOpenChange = (open: boolean) => {
    setDateOpen(open);
    if (open) {
      setSelectedRange({ from: rangeStart, to: rangeEnd });
    }
  };

  const calendarRange = selectedRange ?? {
    from: rangeStart,
    to: rangeEnd,
  };

  const dateLabel =
    format(rangeStart, "MMM d, yyyy") === format(rangeEnd, "MMM d, yyyy")
      ? format(rangeStart, "MMM d, yyyy")
      : `${format(rangeStart, "MMM d")} – ${format(rangeEnd, "MMM d, yyyy")}`;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm text-muted-foreground font-semibold">
        Properties
      </span>
      <div className="flex flex-wrap items-center gap-0.5">
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PropertyTrigger render={<PopoverTrigger />}>
            <StatusIcon
              className="size-3.5 opacity-70"
              color={currentStatus.iconColor}
            />
            <span>{currentStatus.label}</span>
          </PropertyTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <Command>
              <CommandInput placeholder="Change status…" />
              <CommandList>
                <CommandEmpty>No status found</CommandEmpty>
                <CommandGroup>
                  {statusOptions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.value}
                        value={item.label}
                        onSelect={() => {
                          void updateProject({
                            projectId,
                            body: { status: item.value },
                          });
                          setStatusOpen(false);
                        }}
                      >
                        <Icon
                          color={item.iconColor}
                          className="size-3.5 opacity-70"
                        />
                        {item.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <ProjectMangerPicker projectId={projectId} manager={manager} />
        <ProjectMembersPicker projectId={projectId} />

        <Popover open={dateOpen} onOpenChange={handleDateOpenChange}>
          <PropertyTrigger render={<PopoverTrigger />}>
            <RiCalendarLine className="size-3.5 opacity-70" />
            <span>{dateLabel}</span>
          </PropertyTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={rangeStart}
              selected={calendarRange}
              onSelect={(range) => {
                setSelectedRange(range);
                if (!range?.from || !range.to) {
                  return;
                }
                if (range.to < range.from) {
                  return;
                }
                void updateProject({
                  projectId,
                  body: {
                    startDate: startOfDay(range.from).getTime(),
                    endDate: startOfDay(range.to).getTime(),
                  },
                });
                setDateOpen(false);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
