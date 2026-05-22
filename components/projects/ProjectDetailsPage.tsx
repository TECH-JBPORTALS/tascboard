"use client";

import { useMutation, useQuery } from "convex/react";
import { ProjectPageHeader } from "./ProjectPageHeader";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { ProjectProperties } from "./ProjectProperties";
import { ProjectDescription } from "./ProjectDescription";
import { ProjectSummary } from "./ProjectSummary";
import { ProjectTracksSection } from "../tracks/project-tracks-section";
import { TitleInput } from "../TitleInput";
import { ProjectIconPicker } from "./ProjectIconPicker";
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
} from "@/lib/project-appearance";

export function ProjectDetailsPage() {
  const { projectId, orgSlug } = useParams<{
    projectId: Id<"projects">;
    orgSlug: string;
  }>();
  const project = useQuery(api.project.get, { projectId });
  const updateProject = useMutation(api.project.update);

  if (typeof project === "undefined") return <div>Loading...</div>;

  if (project === null) return <div>Project not found</div>;

  return (
    <>
      <ProjectPageHeader
        projectName={project.name ?? ""}
        icon={project.icon ?? DEFAULT_PROJECT_ICON}
        color={project.color ?? DEFAULT_PROJECT_COLOR}
        orgSlug={orgSlug}
      />
      <div className="px-67 py-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <ProjectIconPicker
            size="md"
            icon={project.icon ?? DEFAULT_PROJECT_ICON}
            color={project.color ?? DEFAULT_PROJECT_COLOR}
            onIconChange={(icon) =>
              updateProject({ projectId, body: { icon } })
            }
            onColorChange={(color) =>
              updateProject({ projectId, body: { color } })
            }
          />
          <TitleInput
            value={project.name ?? ""}
            placeholder="Project title"
            className="pb-0 sm:pb-0"
            onSave={(value) =>
              updateProject({ projectId, body: { name: value } })
            }
          />
        </div>
        <ProjectSummary projectId={projectId} summary={project.summary ?? ""} />
        <ProjectProperties
          _id={projectId}
          startDate={project.startDate ?? 0}
          endDate={project.endDate ?? 0}
          status={project.status ?? "active"}
          manager={project.manager}
          members={project.members}
        />
        <ProjectDescription
          projectId={projectId}
          initialDescription={project.description}
        />
        <ProjectTracksSection projectId={projectId} orgSlug={orgSlug} />
      </div>
    </>
  );
}
