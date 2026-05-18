"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

const ONBOARDING_PATH = "/onboarding";

function isExemptPath(pathname: string) {
  return (
    pathname.startsWith("/accept-invitation") ||
    pathname === "/create-organization" ||
    pathname === "/select-organization" ||
    pathname.startsWith("/sign-")
  );
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const activeOrganizationId = session?.session.activeOrganizationId;

  const status = useQuery(
    api.employees.profile.getMyOnboardingStatus,
    activeOrganizationId ? {} : "skip",
  );

  const needsOnboardingQuery = Boolean(activeOrganizationId);

  useEffect(() => {
    if (isExemptPath(pathname)) return;
    if (!needsOnboardingQuery) return;
    if (status === undefined) return;
    if (status === null) return;

    const onOnboarding = pathname === ONBOARDING_PATH;

    if (status.onboardingStatus === "pending" && !onOnboarding) {
      router.replace(ONBOARDING_PATH);
      return;
    }

    if (status.onboardingStatus === "completed" && onOnboarding) {
      router.replace(`/${status.organizationSlug}`);
    }
  }, [needsOnboardingQuery, status, pathname, router]);

  if (sessionPending) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!needsOnboardingQuery || isExemptPath(pathname)) {
    return <>{children}</>;
  }

  if (status === undefined) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
