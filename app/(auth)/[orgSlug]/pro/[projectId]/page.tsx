'use client';

import { useQuery } from 'convex/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ProjectPlateEditor } from '@/components/editor/project-plate-editor';
import { ProjectMetaBar } from '@/components/projects/project-meta-bar';
import { ProjectTitle } from '@/components/projects/project-title';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectPage() {
  const params = useParams<{ orgSlug: string; projectId: string }>();
  const projectId = params.projectId as Id<'projects'>;

  const project = useQuery(api.project.get, { projectId });

  if (project === undefined) {
    return <ProjectPageSkeleton />;
  }

  if (project === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button render={<Link href={`/${params.orgSlug}`} />}>Back to inbox</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="space-y-1 border-b px-6 py-6">
        <p className="text-muted-foreground text-sm">Documentation &amp; tracking</p>
        <ProjectTitle projectId={project._id} name={project.name} />
      </header>

      <ProjectMetaBar
        projectId={project._id}
        endDate={project.endDate}
        status={project.status}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <ProjectPlateEditor
          key={project._id}
          projectId={project._id}
          initialContent={project.docContent}
        />
      </div>
    </div>
  );
}

function ProjectPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="min-h-[60vh] flex-1" />
    </div>
  );
}
