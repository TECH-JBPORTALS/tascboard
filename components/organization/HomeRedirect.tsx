"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

type OrganizationListItem = {
  id: string;
  slug: string;
};

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

    if (orgList.length === 0) {
      router.replace("/create-organization");
      return;
    }

    const activeOrganizationId = session?.session.activeOrganizationId;
    const active =
      orgList.find((org) => org.id === activeOrganizationId) ?? orgList[0];

    void (async () => {
      if (activeOrganizationId !== active.id) {
        await authClient.organization.setActive({
          organizationId: active.id,
        });
      }
      router.replace(`/${active.slug}`);
    })();
  }, [organizations, orgsPending, router, session, sessionPending]);

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-3 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
