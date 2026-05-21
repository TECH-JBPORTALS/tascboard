"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiRouteLine,
} from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { trackStatusLabels } from "@/lib/track-utils";
import { CreateTrackDialog } from "@/components/tracks/create-track-dialog";
import { EditTrackDialog } from "@/components/tracks/edit-track-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ProjectTracksSectionProps = {
  projectId: Id<"projects">;
  orgSlug: string;
};

export function ProjectTracksSection({
  projectId,
  orgSlug,
}: ProjectTracksSectionProps) {
  const tracks = useQuery(api.track.listByProject, { projectId });
  const removeTrack = useMutation(api.track.remove);
  const { data: session } = authClient.useSession();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingTrack, setEditingTrack] = React.useState<Doc<"tracks"> | null>(
    null,
  );
  const [deletingTrack, setDeletingTrack] =
    React.useState<Doc<"tracks"> | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const defaultLeaderId = session?.user?.id ?? "unassigned";
  const existingTrackCodes = tracks?.map((t) => t.trackCode) ?? [];

  async function handleDelete() {
    if (!deletingTrack) return;
    setIsDeleting(true);
    try {
      await removeTrack({ trackId: deletingTrack._id });
      setDeletingTrack(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="mt-8 border-t pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">
            Tracks
          </h2>
          <p className="text-xs text-muted-foreground">
            Organize work into tracks. Open a track to manage backlog and
            sprints.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <RiAddLine className="size-4" />
          Add track
        </Button>
      </div>

      {tracks === undefined ? (
        <p className="text-sm text-muted-foreground">Loading tracks…</p>
      ) : tracks.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No tracks yet. Create one to start planning work.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {tracks.map((track) => (
            <li
              key={track._id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40"
            >
              <RiRouteLine className="size-4 shrink-0 text-muted-foreground" />
              <Link
                href={`/${orgSlug}/pro/${projectId}/track/${track._id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate font-medium text-sm">{track.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {track.trackCode} · {trackStatusLabels[track.status]}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit track"
                  onClick={() => setEditingTrack(track)}
                >
                  <RiEditLine className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete track"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeletingTrack(track)}
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CreateTrackDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        existingTrackCodes={existingTrackCodes}
        defaultLeaderId={defaultLeaderId}
      />

      <EditTrackDialog
        track={editingTrack}
        onOpenChange={(open) => {
          if (!open) setEditingTrack(null);
        }}
      />

      <AlertDialog
        open={deletingTrack !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingTrack(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete track?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingTrack?.name}&quot; and
              all of its tasks and sprints.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
