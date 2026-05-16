"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

export function OrgSlugGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const [ready, setReady] = useState(false);
  const { data: organizations, isPending: orgsPending } =
    authClient.useListOrganizations();

  useEffect(() => {
    if (orgsPending) {
      return;
    }

    const orgList = (organizations ?? []) as Array<{ id: string; slug: string }>;
    const org = orgList.find((item) => item.slug === params.orgSlug);

    if (!org) {
      router.replace("/");
      return;
    }

    void (async () => {
      await authClient.organization.setActive({
        organizationSlug: params.orgSlug,
      });
      setReady(true);
    })();
  }, [organizations, orgsPending, params.orgSlug, router]);

  if (!ready) {
    return (
      <div className="flex h-svh items-center justify-center p-6">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
