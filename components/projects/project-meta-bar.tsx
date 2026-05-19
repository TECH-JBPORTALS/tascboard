'use client';

import { useMutation } from 'convex/react';
import { format } from 'date-fns';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ProjectStatus = Doc<'projects'>['status'];

const statusLabels: Record<ProjectStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  terminated: 'Terminated',
};

const statusVariants: Record<
  ProjectStatus,
  'default' | 'secondary' | 'destructive'
> = {
  active: 'default',
  inactive: 'secondary',
  terminated: 'destructive',
};

type ProjectMetaBarProps = {
  projectId: Id<'projects'>;
  endDate: number;
  status: ProjectStatus;
};

export function ProjectMetaBar({
  projectId,
  endDate,
  status,
}: ProjectMetaBarProps) {
  const updateProject = useMutation(api.project.update);

  const dueDateValue = format(new Date(endDate), 'yyyy-MM-dd');

  function handleDueDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextDate = new Date(event.target.value);

    if (Number.isNaN(nextDate.getTime())) {
      return;
    }

    void updateProject({
      projectId,
      body: { endDate: nextDate.getTime() },
    });
  }

  function handleStatusChange(nextStatus: ProjectStatus | null) {
    if (!nextStatus) {
      return;
    }

    void updateProject({
      projectId,
      body: { status: nextStatus },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border-b px-6 py-3">
      <div className="flex items-center gap-2">
        <Label
          htmlFor="project-due-date"
          className="text-muted-foreground text-xs uppercase tracking-wide"
        >
          Due date
        </Label>
        <input
          id="project-due-date"
          type="date"
          value={dueDateValue}
          onChange={handleDueDateChange}
          className={cn(
            'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wide">
          Status
        </Label>
        <Select
          value={status}
          onValueChange={(value) => handleStatusChange(value as ProjectStatus)}
        >
          <SelectTrigger size="sm" className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(statusLabels) as ProjectStatus[]).map((value) => (
              <SelectItem key={value} value={value}>
                {statusLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant={statusVariants[status]} className="capitalize">
          {statusLabels[status]}
        </Badge>
      </div>
    </div>
  );
}
