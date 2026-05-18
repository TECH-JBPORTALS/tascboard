"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrganizationAvatar } from "@/components/organization/OrganizationAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RiArrowRightLine } from "@remixicon/react";

type ViewState =
  | "loading"
  | "not_found"
  | "expired"
  | "already_handled"
  | "email_mismatch"
  | "ready"
  | "accepting"
  | "done";

export function AcceptInvitationPage() {
  const params = useParams<{ invitationId: string }>();
  const router = useRouter();
  const invitationId = params.invitationId;
  const preview = useQuery(api.employees.getInvitationPreview, {
    invitationId,
  });
  const { data: session } = authClient.useSession();
  const [view, setView] = useState<ViewState>("loading");
  const [error, setError] = useState<string | null>(null);

  const returnUrl = `/accept-invitation/${invitationId}`;

  const setState = useCallback(() => {
    if (preview === undefined) {
      setView("loading");
      return;
    }

    if (preview === null) {
      setView("not_found");
      return;
    }

    if (preview.status === "accepted") {
      setView("already_handled");
      return;
    }

    if (
      preview.status === "canceled" ||
      preview.status === "cancelled" ||
      preview.status === "rejected"
    ) {
      setView("already_handled");
      return;
    }

    if (preview.expiresAt < Date.now()) {
      setView("expired");
      return;
    }

    if (preview.status !== "pending") {
      setView("already_handled");
      return;
    }

    if (!session?.user) {
      setView("ready");
      return;
    }

    const sessionEmail = session.user.email?.toLowerCase();
    if (sessionEmail && sessionEmail !== preview.email.toLowerCase()) {
      setView("email_mismatch");
      return;
    }

    setView("ready");
  }, [preview, session?.user]);

  setState();

  async function handleAccept() {
    if (!preview || view !== "ready") return;

    setView("accepting");
    setError(null);

    const result = await authClient.organization.acceptInvitation({
      invitationId,
    });

    if (result.error) {
      setError(result.error.message ?? "Could not accept invitation");
      setView("ready");
      return;
    }

    await authClient.organization.setActive({
      organizationId: preview.organizationId,
    });

    setView("done");
    router.replace("/onboarding");
  }

  if (view === "loading" || preview === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  if (view === "not_found" || preview === null) {
    return (
      <CenteredCard
        title="Invitation not found"
        description="This invitation link is invalid or has been removed."
        action={<Button render={<Link href="/" />}>Go to dashboard</Button>}
      />
    );
  }

  if (view === "expired") {
    return (
      <CenteredCard
        title="Invitation expired"
        description="Ask your administrator to send a new invitation."
        action={<Button render={<Link href="/" />}>Go to dashboard</Button>}
      />
    );
  }

  if (view === "already_handled") {
    return (
      <CenteredCard
        title="Invitation unavailable"
        description={`This invitation has already been ${preview.status}.`}
        action={
          <Button render={<Link href={`/${preview.organizationSlug}`} />}>
            Open organization
          </Button>
        }
      />
    );
  }

  if (view === "email_mismatch") {
    return (
      <CenteredCard
        title="Wrong account"
        description={`Sign in as ${preview.email} to accept this invitation. You are signed in as ${session?.user.email}.`}
        action={
          <Button
            onClick={() =>
              void authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push(
                      `/sign-in?redirect=${encodeURIComponent(returnUrl)}`,
                    );
                  },
                },
              })
            }
          >
            Sign out and continue
          </Button>
        }
      />
    );
  }

  if (!session?.user) {
    const redirect = encodeURIComponent(returnUrl);
    return (
      <CenteredCard
        title={`Join ${preview.organizationName}`}
        description={`Sign in or create an account with ${preview.email} to accept this invitation.`}
        orgName={preview.organizationName}
        orgLogo={preview.organizationLogo}
        badge="Sign in required"
        action={
          <div className="flex w-full flex-col gap-2">
            <Button render={<Link href={`/sign-in?redirect=${redirect}`} />}>
              Sign in
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/sign-up?redirect=${redirect}`} />}
            >
              Create account
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <OrganizationAvatar
              name={preview.organizationName}
              imageStorageId={undefined}
              className="mx-auto size-16"
            />
          </div>
          <CardTitle>You&apos;re invited</CardTitle>
          <CardDescription>
            Join{" "}
            <span className="font-medium text-foreground">
              {preview.organizationName}
            </span>{" "}
            on Tascboard with {preview.email}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center text-sm text-muted-foreground">
          <Badge variant="secondary" className="capitalize">
            {preview.role ?? "member"}
          </Badge>
          <p>Invited email: {preview.email}</p>
          {error ? <p className="text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={view === "accepting"}
            onClick={() => void handleAccept()}
          >
            {view === "accepting" ? "Accepting..." : "Accept invitation"}
            <RiArrowRightLine />
          </Button>
          <Button variant="ghost" className="w-full" render={<Link href="/" />}>
            Decline for now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function CenteredCard({
  title,
  description,
  action,
  orgName,
  orgLogo,
  badge,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
  orgName?: string;
  orgLogo?: string | null;
  badge?: string;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {orgName ? (
            <div className="mx-auto mb-4">
              <OrganizationAvatar
                name={orgName}
                imageStorageId={undefined}
                className="mx-auto size-16"
              />
            </div>
          ) : null}
          {badge ? (
            <Badge variant="outline" className="mb-2">
              {badge}
            </Badge>
          ) : null}
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">{action}</CardFooter>
      </Card>
    </div>
  );
}
