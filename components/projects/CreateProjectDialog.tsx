"use client";

import { useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { api } from "@/convex/_generated/api";
import {
  ProjectIconPicker,
  useProjectIconPickerState,
} from "@/components/projects/ProjectIconPicker";
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
} from "@/lib/project-appearance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
});

type CreateProjectValues = z.infer<typeof createProjectSchema>;

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const createProject = useMutation(api.project.create);
  const { icon, color, setIcon, setColor } = useProjectIconPickerState();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "" },
  });

  React.useEffect(() => {
    if (open) {
      setIcon(DEFAULT_PROJECT_ICON);
      setColor(DEFAULT_PROJECT_COLOR);
    } else {
      form.reset();
    }
  }, [form, open, setColor, setIcon]);

  const onSubmit = React.useCallback(
    async (values: CreateProjectValues) => {
      setIsSubmitting(true);

      try {
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        const projectId = await createProject({
          name: values.name,
          icon,
          color,
          startDate: Date.now(),
          endDate: Date.now() + thirtyDaysMs,
          status: "inactive",
        });

        onOpenChange(false);
        router.push(`/${params.orgSlug}/pro/${projectId}`);
      } catch (error) {
        form.setError("root", {
          message:
            error instanceof Error ? error.message : "Failed to create project",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [color, createProject, form, icon, onOpenChange, params.orgSlug, router],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Name your project and pick an icon and color.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex items-start gap-3">
            <ProjectIconPicker
              icon={icon}
              color={color}
              onIconChange={setIcon}
              onColorChange={setColor}
              size="lg"
            />
            <Field className="flex-1">
              <Input
                id="project-name"
                placeholder="Project name"
                autoFocus
                className="h-10"
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
          </div>

          {form.formState.errors.root ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
