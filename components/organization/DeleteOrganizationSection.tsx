"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { DELETE_ORGANIZATION_PLEDGE } from "@/lib/organization";
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

type Organization = {
  id: string;
  name: string;
};

export function DeleteOrganizationSection() {
  const router = useRouter();
  const { data: organization } = authClient.useActiveOrganization();
  const org = organization as Organization | null | undefined;

  const [confirmName, setConfirmName] = useState("");
  const [pledge, setPledge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete =
    org &&
    confirmName === org.name &&
    pledge === DELETE_ORGANIZATION_PLEDGE;

  async function handleDelete() {
    if (!org || !canDelete) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    const result = await authClient.organization.delete({
      organizationId: org.id,
    });

    setIsDeleting(false);

    if (result.error) {
      setError(result.error.message ?? "Failed to delete organization");
      return;
    }

    router.replace("/select-organization");
    router.refresh();
  }

  if (!org) {
    return null;
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Deleting this organization is permanent. All organization data will be
          removed and cannot be recovered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          To confirm, type the organization name{" "}
          <span className="font-medium text-foreground">{org.name}</span> and
          enter the pledge exactly as shown.
        </p>

        <Field>
          <Label htmlFor="delete-org-name">Organization name</Label>
          <Input
            id="delete-org-name"
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            placeholder={org.name}
          />
        </Field>

        <Field>
          <Label htmlFor="delete-org-pledge">Confirmation pledge</Label>
          <Input
            id="delete-org-pledge"
            value={pledge}
            onChange={(event) => setPledge(event.target.value)}
            placeholder={DELETE_ORGANIZATION_PLEDGE}
          />
          <p className="text-xs text-muted-foreground">
            Type: {DELETE_ORGANIZATION_PLEDGE}
          </p>
        </Field>

        {error ? <FieldError errors={[{ message: error }]} /> : null}

        <Button
          type="button"
          variant="destructive"
          disabled={!canDelete || isDeleting}
          onClick={() => void handleDelete()}
        >
          {isDeleting ? "Deleting..." : "Delete organization"}
        </Button>
      </CardContent>
    </Card>
  );
}
