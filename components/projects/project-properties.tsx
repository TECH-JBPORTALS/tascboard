'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { format } from 'date-fns';
import {
  RiCalendarLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiStopCircleLine,
} from '@remixicon/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type ProjectStatus = Doc<'projects'>['status'];

const statusOptions: {
  value: ProjectStatus;
  label: string;
  icon: typeof RiPauseCircleLine;
}[] = [
  { value: 'inactive', label: 'Inactive', icon: RiPauseCircleLine },
  { value: 'active', label: 'Active', icon: RiPlayCircleLine },
  { value: 'terminated', label: 'Terminated', icon: RiStopCircleLine },
];

type ProjectPropertiesProps = {
  projectId: Id<'projects'>;
  endDate: number;
  status: ProjectStatus;
};

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
        'h-7 gap-1.5 px-2 font-normal text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ProjectProperties({
  projectId,
  endDate,
  status,
}: ProjectPropertiesProps) {
  const updateProject = useMutation(api.project.update);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);

  const currentStatus = statusOptions.find((item) => item.value === status)!;
  const StatusIcon = currentStatus.icon;
  const dueDate = new Date(endDate);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm text-muted-foreground">Properties</span>
      <div className="flex flex-wrap items-center gap-0.5">
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PropertyTrigger render={<PopoverTrigger />}>
            <StatusIcon className="size-3.5 opacity-70" />
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
                        <Icon className="size-3.5 opacity-70" />
                        {item.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PropertyTrigger render={<PopoverTrigger />}>
            <RiCalendarLine className="size-3.5 opacity-70" />
            <span>{format(dueDate, 'MMM d, yyyy')}</span>
          </PropertyTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => {
                if (!date) {
                  return;
                }
                void updateProject({
                  projectId,
                  body: { endDate: date.getTime() },
                });
                setDateOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
