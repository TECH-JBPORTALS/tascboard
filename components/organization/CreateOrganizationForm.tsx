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
  slugifyOrganizationName,
} from "@/lib/organization";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationAvatar } from "./OrganizationAvatar";
import { cn } from "@/lib/utils";

const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  address: z.string().min(5, "Address is required"),
  image: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Organization image is required")
    .refine(
      (files) => files?.[0]?.type.startsWith("image/"),
      "Image must be a valid image file",
    ),
});

type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>;

export function CreateOrganizationForm() {
  const router = useRouter();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateOrganizationValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  const organizationName = form.watch("name");
  const selectedImage = form.watch("image");

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

  async function onSubmit(values: CreateOrganizationValues) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const file = values.image[0];
      const imageStorageId = await uploadImage(file);
      const slug = slugifyOrganizationName(values.name);

      const slugCheck = await authClient.organization.checkSlug({ slug });
      if (slugCheck.error) {
        setSubmitError("Could not verify organization URL. Try again.");
        return;
      }

      const result = await authClient.organization.create({
        name: values.name.trim(),
        slug,
        metadata: buildOrganizationMetadata({
          address: values.address.trim(),
          imageStorageId,
        }),
      });

      if (result.error) {
        setSubmitError(result.error.message ?? "Failed to create organization");
        return;
      }

      const organization = result.data;
      if (!organization?.slug) {
        setSubmitError("Organization was created but could not be opened.");
        return;
      }

      router.replace(`/${organization.slug}`);
      router.refresh();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create your organization</CardTitle>
        <CardDescription>
          Add your organization details to start using Tascboard.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 py-4">
          <Controller
            name="image"
            control={form.control}
            render={({ field: { onChange, ref, onBlur }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex gap-4 items-center">
                  <Label htmlFor="org-image">
                    <div
                      className={cn(
                        "mb-2 flex border-2 border-dashed active:scale-95 size-16 items-center justify-center overflow-hidden rounded-xl",
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
                          className="size-16 rounded-xl text-base"
                        />
                      )}
                    </div>
                  </Label>

                  <div className="gap-0.5 flex flex-col">
                    <span>Organization Logo</span>
                    <p className="text-sm text-muted-foreground">
                      Recommended 256x256px
                    </p>
                  </div>
                </div>
                <Input
                  id="org-image"
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
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="org-name">Organization name</Label>
                <Input id="org-name" placeholder="Acme Inc." {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="org-address">Address</Label>
                <Textarea
                  id="org-address"
                  placeholder="Street, city, state, country"
                  rows={3}
                  className="resize-none"
                  {...field}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create organization"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
