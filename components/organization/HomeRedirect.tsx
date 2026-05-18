"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  organizationPath,
  resolveOrganizationDestination,
  type OrganizationListItem,
} from "@/lib/organization-membership";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeRedirect() {
  const router = useRouter();
  const { data: organizations, isPending: orgsPending } =
    authClient.useListOrganizations();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  useEffect(() => {
    if (orgsPending || sessionPending) {
      return;
    }

    const orgList = (organizations ?? []) as OrganizationListItem[];
    const activeOrganizationId = session?.session.activeOrganizationId;
    const destination = resolveOrganizationDestination(
      orgList,
      activeOrganizationId,
    );

    if (destination.type === "organization") {
      void (async () => {
        if (activeOrganizationId !== destination.organization.id) {
          await authClient.organization.setActive({
            organizationId: destination.organization.id,
          });
        }
        router.replace(`/${destination.organization.slug}`);
      })();
      return;
    }

    router.replace(organizationPath(destination));
  }, [organizations, orgsPending, router, session, sessionPending]);

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-3 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
