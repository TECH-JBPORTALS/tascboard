"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  findOrganizationBySlug,
  organizationPath,
  resolveOrganizationDestination,
  type OrganizationListItem,
} from "@/lib/organization-membership";
import { Skeleton } from "@/components/ui/skeleton";

export function OrgSlugGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const [ready, setReady] = useState(false);
  const { data: organizations, isPending: orgsPending } =
    authClient.useListOrganizations();

  const { data: session, isPending: sessionPending } = authClient.useSession();

  useEffect(() => {
    if (orgsPending || sessionPending) {
      return;
    }

    const orgList = (organizations ?? []) as OrganizationListItem[];
    const org = findOrganizationBySlug(orgList, params.orgSlug);

    if (!org) {
      const destination = resolveOrganizationDestination(
        orgList,
        session?.session.activeOrganizationId,
      );
      router.replace(organizationPath(destination));
      return;
    }

    void (async () => {
      await authClient.organization.setActive({
        organizationSlug: params.orgSlug,
      });
      setReady(true);
    })();
  }, [
    organizations,
    orgsPending,
    params.orgSlug,
    router,
    session,
    sessionPending,
  ]);

  if (!ready) {
    return (
      <div className="flex h-svh items-center justify-center p-6">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
