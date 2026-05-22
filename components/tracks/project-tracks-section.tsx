"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import {
  RiAddLine,
  RiArchiveLine,
  RiCheckboxCircleLine,
  RiRouteLine,
  RiTimeLine,
  RiTriangleFill,
  RiMoreFill,
} from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import {
  nextTrackCode,
  trackStatusLabels,
  type TrackStatus,
} from "@/lib/track-utils";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { TitleInput } from "../TitleInput";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { PlateEditor } from "../editor/plate-editor";

type ProjectTracksSectionProps = {
  projectId: Id<"projects">;
  orgSlug: string;
};

type TrackCreateComposerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: Id<"projects">;
  existingTrackCodes: string[];
  defaultLeaderId: string;
  onCreated: () => void;
};

type TrackListRowProps = {
  track: Doc<"tracks">;
  onDelete: (track: Doc<"tracks">) => void;
};

type TrackStatusSelectProps = {
  value: TrackStatus;
  onValueChange: (value: TrackStatus | null) => void;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
};

const TRACK_STATUS_META: Record<
  TrackStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    iconClassName: string;
  }
> = {
  active: {
    icon: RiTimeLine,
    label: "Active",
    iconClassName: "text-sky-600 dark:text-sky-400",
  },
  completed: {
    icon: RiCheckboxCircleLine,
    label: "Completed",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  archived: {
    icon: RiArchiveLine,
    label: "Archived",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
};

const TRACK_STATUS_OPTIONS: Array<{
  value: TrackStatus;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  iconClassName: string;
}> = [
  {
    value: "active",
    icon: RiTimeLine,
    label: "Active",
    iconClassName: TRACK_STATUS_META.active.iconClassName,
  },
  {
    value: "completed",
    icon: RiCheckboxCircleLine,
    label: "Completed",
    iconClassName: TRACK_STATUS_META.completed.iconClassName,
  },
  {
    value: "archived",
    icon: RiArchiveLine,
    label: "Archived",
    iconClassName: TRACK_STATUS_META.archived.iconClassName,
  },
];

function TrackStatusSelect({
  value,
  onValueChange,
  disabled,
  align = "end",
  triggerClassName,
}: TrackStatusSelectProps) {
  const statusMeta = TRACK_STATUS_META[value];
  const StatusIcon = statusMeta.icon;

  return (
    <Select
      value={value}
      onValueChange={(nextValue) =>
        onValueChange(nextValue as TrackStatus | null)
      }
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={`h-7 w-fit border-none text-xs! ml-auto ${triggerClassName ?? ""}`}
      >
        <span className="inline-flex items-center gap-1.5">
          <StatusIcon className={`size-3.5 ${statusMeta.iconClassName}`} />
          <span>{statusMeta.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent align={align}>
        <SelectGroup>
          {TRACK_STATUS_OPTIONS.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              <span className="inline-flex items-center gap-2">
                <status.icon className={`size-3.5 ${status.iconClassName}`} />
                {status.label}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function TrackCreateComposer({
  open,
  onOpenChange,
  projectId,
  existingTrackCodes,
  defaultLeaderId,
  onCreated,
}: TrackCreateComposerProps) {
  const createTrack = useMutation(api.track.create);
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newStatus, setNewStatus] = React.useState<TrackStatus>("active");
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => nameInputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
  }, [open]);

  function resetForm() {
    setNewName("");
    setNewDescription("");
    setNewStatus("active");
    setCreateError(null);
  }

  function closeForm() {
    onOpenChange(false);
    resetForm();
  }

  async function handleCreateTrack(title: string) {
    const trimmedName = title.trim();
    if (!trimmedName) {
      setCreateError("Track title is required");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      await createTrack({
        name: trimmedName,
        description: newDescription.trim() || undefined,
        projectId,
        trackCode: nextTrackCode(existingTrackCodes),
        trackLeaderID: defaultLeaderId,
        status: newStatus,
      });
      closeForm();
      onCreated();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create track",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div
      className={`grid transition-all origin-top duration-200 ease-out ${
        open ? "grid-rows-[1fr] opacity-100 " : "grid-rows-[0fr]  opacity-0"
      }`}
      aria-hidden={!open}
    >
      <Card>
        <CardHeader className="flex gap-2 items-center">
          <RiRouteLine className="size-4 shrink-0 text-muted-foreground" />
          <TitleInput
            blurOnSave={false}
            value={newName}
            onChange={(value) => setNewName(value as string)}
            placeholder="Track title"
            className="text-base! pb-0!"
            onSave={(title) => void handleCreateTrack(title)}
          />
        </CardHeader>
        <CardContent>
          <PlateEditor
            value={newDescription}
            onChange={(value) => setNewDescription(value)}
            placeholder="Add a description..."
            className="text-base! font-normal! py-0!"
          />
        </CardContent>
        <CardFooter className="justify-between flex">
          {createError ? (
            <p className="text-xs text-destructive">{createError}</p>
          ) : (
            <TrackStatusSelect
              value={newStatus}
              onValueChange={(value) => {
                if (value) setNewStatus(value);
              }}
              triggerClassName="h-8 w-fit bg-transparent shadow-none hover:bg-muted"
            />
          )}
          <div className="flex items-center flex-1 justify-end gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeForm}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isCreating}>
              {isCreating ? "Creating…" : "Create track"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function TrackListRow({ track, onDelete }: TrackListRowProps) {
  const updateTrack = useMutation(api.track.update);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isSavingText, setIsSavingText] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(track.name);
  const descriptionDraft = track.description ?? "";

  async function saveTextFields(nextTitle: string, nextDescription: string) {
    const trimmedTitle = nextTitle.trim();
    const normalizedDescription = nextDescription.trim();
    if (!trimmedTitle) {
      setTitleDraft(track.name);
      return;
    }
    const hasNameChange = trimmedTitle !== track.name;
    const hasDescriptionChange =
      normalizedDescription !== (track.description ?? "").trim();
    if (!hasNameChange && !hasDescriptionChange) return;

    setIsSavingText(true);
    setTitleDraft(trimmedTitle);
    try {
      await updateTrack({
        trackId: track._id,
        body: {
          name: trimmedTitle,
          description: normalizedDescription,
        },
      });
    } finally {
      setIsSavingText(false);
    }
  }

  async function handleStatusChange(value: TrackStatus | null) {
    if (!value) return;
    const nextStatus = value;
    if (nextStatus === track.status) return;
    setIsUpdatingStatus(true);
    try {
      await updateTrack({
        trackId: track._id,
        body: {
          status: nextStatus,
        },
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <Collapsible>
      <div className="group flex items-center gap-2 px-3 py-1.5 hover:bg-muted/30 rounded-lg">
        <RiRouteLine className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex items-center gap-1">
          <TitleInput
            value={titleDraft}
            onSave={(save) => {
              setTitleDraft(save);
              void saveTextFields(save, descriptionDraft);
            }}
            disabled={isSavingText}
            className="text-base! pb-0!"
          />
          <CollapsibleTrigger
            render={<Button size={"icon-xs"} variant={"ghost"} />}
          >
            <RiTriangleFill className="size-1.5 text-muted-foreground group-aria-expanded/button:rotate-180! rotate-90 transition-transform duration-150" />
          </CollapsibleTrigger>
        </div>
        <TrackStatusSelect
          value={track.status}
          onValueChange={(value) => {
            void handleStatusChange(value);
          }}
          disabled={isUpdatingStatus}
          triggerClassName="ml-auto"
        />

        <div className="flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Track actions"
              render={<Button size={"icon-xs"} variant={"ghost"} />}
            >
              <RiMoreFill className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(track)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CollapsibleContent className={"px-6 py-2.5"}>
        <TitleInput
          value={descriptionDraft}
          onSave={(save) => void saveTextFields(titleDraft, save)}
          className="text-base! pb-0! pt-0! font-normal!"
          placeholder="Add description..."
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProjectTracksSection(props: ProjectTracksSectionProps) {
  const { projectId } = props;
  const tracks = useQuery(api.track.listByProject, { projectId });
  const removeTrack = useMutation(api.track.remove);
  const { data: session } = authClient.useSession();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [hasStartedCreating, setHasStartedCreating] = React.useState(false);
  const [deletingTrack, setDeletingTrack] =
    React.useState<Doc<"tracks"> | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const defaultLeaderId = session?.user?.id ?? "unassigned";
  const existingTrackCodes = tracks?.map((t) => t.trackCode) ?? [];
  const hasTracks = (tracks?.length ?? 0) > 0;
  const showHeader = hasTracks || hasStartedCreating || createOpen;

  function openCreateForm() {
    setHasStartedCreating(true);
    setCreateOpen(true);
  }

  function closeCreateForm(open: boolean) {
    if (open) {
      openCreateForm();
      return;
    }
    setHasStartedCreating(false);
    setCreateOpen(false);
  }

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
    <section className=" pt-6">
      {showHeader ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Tracks
          </h2>
        </div>
      ) : null}

      {tracks === undefined ? (
        <p className="text-sm text-muted-foreground">Loading tracks…</p>
      ) : (
        <div className="space-y-3">
          {!hasTracks ? (
            <div className="space-y-2">
              {!createOpen ? (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={openCreateForm}
                  className="h-7 w-fit px-2 text-xs"
                >
                  <RiAddLine className="size-4" />
                  Track
                </Button>
              ) : null}
            </div>
          ) : null}

          {hasTracks ? (
            <ul className="space-y-2">
              {tracks.map((track) => (
                <TrackListRow
                  key={track._id}
                  track={track}
                  onDelete={setDeletingTrack}
                />
              ))}
            </ul>
          ) : null}

          <TrackCreateComposer
            open={createOpen}
            onOpenChange={closeCreateForm}
            projectId={projectId}
            existingTrackCodes={existingTrackCodes}
            defaultLeaderId={defaultLeaderId}
            onCreated={() => setHasStartedCreating(true)}
          />

          {showHeader ? (
            <Button
              type="button"
              size="xs"
              disabled={createOpen}
              variant="ghost"
              onClick={openCreateForm}
              className={"text-muted-foreground hover:text-foreground"}
            >
              <RiAddLine className="size-4" />
              Track
            </Button>
          ) : null}
        </div>
      )}

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
