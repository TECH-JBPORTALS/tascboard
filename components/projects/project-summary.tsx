'use client';

import { useMutation } from 'convex/react';
import * as React from 'react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';

type ProjectSummaryProps = {
  projectId: Id<'projects'>;
  summary?: string | null;
};

export function ProjectSummary({ projectId, summary }: ProjectSummaryProps) {
  const updateProject = useMutation(api.project.update);
  const [value, setValue] = React.useState(summary ?? '');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setValue(summary ?? '');
  }, [summary]);

  async function saveSummary() {
    const trimmed = value.trim();
    const current = (summary ?? '').trim();

    if (trimmed === current) {
      setValue(summary ?? '');
      return;
    }

    setIsSaving(true);

    try {
      await updateProject({
        projectId,
        body: { summary: trimmed.length > 0 ? trimmed : undefined },
      });
    } catch {
      setValue(summary ?? '');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => void saveSummary()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
      disabled={isSaving}
      className={cn(
        'w-full border-none bg-transparent text-sm text-muted-foreground outline-none',
        'placeholder:text-muted-foreground/70 focus-visible:text-foreground',
      )}
      placeholder="Add a short summary…"
      aria-label="Project summary"
    />
  );
}
