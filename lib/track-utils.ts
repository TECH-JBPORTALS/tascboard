import type { Doc } from "@/convex/_generated/dataModel";

export type TrackStatus = Doc<"tracks">["status"];
export type SprintStatus = Doc<"sprints">["status"];

export const trackStatusLabels: Record<TrackStatus, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

export const sprintStatusLabels: Record<SprintStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

export function initialsFromId(id: string) {
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, "");
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2).toUpperCase();
  }
  return id.slice(0, 2).toUpperCase();
}

export function nextTrackCode(existingCodes: string[]) {
  const numbers = existingCodes
    .map((code) => {
      const match = code.match(/(\d+)$/);
      return match ? Number.parseInt(match[1]!, 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `TRK-${String(next).padStart(3, "0")}`;
}

export function nextTaskCode(trackCode: string, existingCodes: string[]) {
  const prefix = trackCode.split("-")[0] ?? "TASK";
  const numbers = existingCodes
    .map((code) => {
      const match = code.match(/-(\d+)$/);
      return match ? Number.parseInt(match[1]!, 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}
