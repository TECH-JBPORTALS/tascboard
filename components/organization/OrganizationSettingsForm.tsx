"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import {
  buildOrganizationMetadata,
  parseOrganizationMetadata,
} from "@/lib/organization";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationAvatar } from "./OrganizationAvatar";
import { cn } from "@/lib/utils";

const settingsSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  address: z.string().min(5, "Address is required"),
  image: z.custom<FileList>().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

type Organization = {
  id: string;
  name: string;
  slug: string;
  metadata?: string | Record<string, unknown> | null;
};

export function OrganizationSettingsForm() {
  const router = useRouter();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { data: organization, isPending } = authClient.useActiveOrganization();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const org = organization as Organization | null | undefined;
  const metadata = parseOrganizationMetadata(org?.metadata);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  useEffect(() => {
    if (!org) {
      return;
    }

    form.reset({
      name: org.name,
      address: metadata.address,
    });
  }, [form, metadata.address, org]);

  const selectedImage = form.watch("image");
  const organizationName = form.watch("name");

  useEffect(() => {
    const file = selectedImage?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  async function uploadImage(file: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateUploadUrl({});
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload organization image");
    }

    const { storageId } = (await response.json()) as {
      storageId: Id<"_storage">;
    };
    return storageId;
  }

  async function onSubmit(values: SettingsValues) {
    if (!org) {
      return;
    }

    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      let imageStorageId = metadata.imageStorageId;
      const file = values.image?.[0];
      if (file) {
        imageStorageId = await uploadImage(file);
      }

      const result = await authClient.organization.update({
        organizationId: org.id,
        data: {
          name: values.name.trim(),
          metadata: buildOrganizationMetadata({
            address: values.address.trim(),
            imageStorageId,
          }),
        },
      });

      if (result.error) {
        setSubmitError(result.error.message ?? "Failed to update organization");
        return;
      }

      setSuccessMessage("Organization settings saved.");
      router.refresh();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPending || !org) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
        <CardDescription>
          Update your organization name, image, and address.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="settings-org-name">Organization name</Label>
                <Input id="settings-org-name" {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Field>
            <Label>Organization URL</Label>
            <Input value={`/${org.slug}`} disabled />
          </Field>

          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="settings-org-address">Address</Label>
                <Textarea id="settings-org-address" rows={3} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="image"
            control={form.control}
            render={({ field: { onChange, ref, onBlur }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center gap-4">
                  <Label htmlFor="settings-org-image">
                    <OrganizationImagePreview
                      previewUrl={previewUrl}
                      organizationName={organizationName}
                      imageStorageId={metadata.imageStorageId}
                    />
                  </Label>
                  <div className="gap-0.5 flex flex-col">
                    <span>Organization Logo</span>
                    <p className="text-sm text-muted-foreground">
                      Recommended 256x256px
                    </p>
                  </div>
                </div>
                <Input
                  id="settings-org-image"
                  ref={ref}
                  type="file"
                  accept="image/*"
                  onBlur={onBlur}
                  hidden
                  onChange={(event) => onChange(event.target.files)}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-primary">{successMessage}</p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

function OrganizationImagePreview({
  previewUrl,
  organizationName,
  imageStorageId,
}: {
  previewUrl: string | null;
  organizationName: string;
  imageStorageId?: string;
}) {
  return (
    <div
      className={cn(
        "mb-2 flex size-16! items-center justify-center overflow-hidden rounded-xl border bg-muted",
      )}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Organization preview"
          className="size-full object-cover"
        />
      ) : (
        <OrganizationAvatar
          name={organizationName || "Organization"}
          imageStorageId={imageStorageId}
          className="size-16! rounded-xl text-base"
        />
      )}
    </div>
  );
}
