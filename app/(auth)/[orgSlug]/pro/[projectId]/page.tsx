"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ProjectPlateEditor } from "@/components/projects/project-plate-editor";
import { ProjectIconPicker } from "@/components/projects/project-icon-picker";
import {
  ProjectDetailPanel,
  ProjectDetailPanelToggle,
} from "@/components/projects/project-detail-panel";
import { ProjectPageHeader } from "@/components/projects/project-page-header";
import { ProjectProperties } from "@/components/projects/project-properties";
import { useProjectDetailPanel } from "@/hooks/use-project-detail-panel";
import { ProjectSummary } from "@/components/projects/project-summary";
import { ProjectTitle } from "@/components/projects/project-title";
import type { ProjectColorId } from "@/lib/project-appearance";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ProjectPage() {
  const params = useParams<{ orgSlug: string; projectId: string }>();
  const projectId = params.projectId as Id<"projects">;
  const { open: panelOpen, toggle: togglePanel, hydrated } = useProjectDetailPanel();

  const project = useQuery(api.project.get, { projectId });

  if (project === undefined) {
    return <ProjectPageSkeleton />;
  }

  if (project === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button render={<Link href={`/${params.orgSlug}`} />}>
          Back to inbox
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ProjectPageHeader
        orgSlug={params.orgSlug}
        projectName={project.name}
        icon={project.icon}
        color={project.color}
        actions={
          hydrated ? (
            <ProjectDetailPanelToggle open={panelOpen} onToggle={togglePanel} />
          ) : null
        }
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8">
        <div className="flex flex-col items-start gap-3">
          <div className="flex gap-3">
            <ProjectIconPickerField project={project} />
            <ProjectTitle projectId={project._id} name={project.name} />
          </div>
          <div className="min-w-0 w-full pt-0.5">
            <ProjectSummary projectId={project._id} summary={project.summary} />
          </div>
        </div>

        <div className="mt-5">
          <ProjectProperties
            projectId={project._id}
            startDate={project.startDate}
            endDate={project.endDate}
            status={project.status}
          />
        </div>

        <Separator className="my-5" />

        <section className="flex min-h-0 flex-1 flex-col">
          <p className="text-sm text-muted-foreground font-semibold">
            Description
          </p>
          <ProjectPlateEditor
            key={project._id}
            projectId={project._id}
            initialContent={project.description}
          />
        </section>
      </div>

      {hydrated ? (
        <ProjectDetailPanel projectId={project._id} open={panelOpen} />
      ) : null}
      </div>
    </div>
  );
}

function ProjectIconPickerField({ project }: { project: Doc<"projects"> }) {
  const updateProject = useMutation(api.project.update);

  return (
    <ProjectIconPicker
      icon={project.icon ?? "📁"}
      color={(project.color ?? "purple") as ProjectColorId}
      onIconChange={(icon) => {
        void updateProject({ projectId: project._id, body: { icon } });
      }}
      onColorChange={(color) => {
        void updateProject({ projectId: project._id, body: { color } });
      }}
    />
  );
}

function ProjectPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 items-center border-b px-4">
        <Skeleton className="h-4 w-48" />
      </header>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <div className="flex gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="min-h-[50vh] w-full" />
      </div>
    </div>
  );
}
