"use client";

import { useQuery } from "convex/react";
import { ProjectPageHeader } from "./project-page-header";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { ProjectTitle } from "./project-title";
import { ProjectProperties } from "./ProjectProperties";

export function ProjectDetailsPage() {
  const { projectId, orgSlug } = useParams<{
    projectId: Id<"projects">;
    orgSlug: string;
  }>();
  const project = useQuery(api.project.get, { projectId });

  if (typeof project === "undefined") return <div>Loading...</div>;

  if (project === null) return <div>Project not found</div>;

  return (
    <>
      <ProjectPageHeader projectName={project.name ?? ""} orgSlug={orgSlug} />
      <div className="px-67 py-6 space-y-4">
        <ProjectTitle projectId={projectId} name={project.name ?? ""} />
        <ProjectProperties
          projectId={projectId}
          startDate={project.startDate}
          endDate={project.endDate}
          status={project.status}
        />
      </div>
    </>
  );
}
