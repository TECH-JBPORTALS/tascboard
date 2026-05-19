'use client';

import { useMutation } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
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
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '' },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
      setSubmitError(null);
    }
  }, [form, open]);

  async function onSubmit(values: CreateProjectValues) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      const projectId = await createProject({
        name: values.name,
        startDate: now,
        endDate: now + thirtyDaysMs,
        status: 'inactive',
      });

      onOpenChange(false);
      router.push(`/${params.orgSlug}/pro/${projectId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create project',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Add a new project to document goals, specs, and progress.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Field>
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Project Apollo"
              autoFocus
              {...form.register('name')}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
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
              {isSubmitting ? 'Creating…' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
