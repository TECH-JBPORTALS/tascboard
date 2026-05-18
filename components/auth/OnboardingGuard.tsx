"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

const ONBOARDING_PATH = "/onboarding";

function isExemptPath(pathname: string) {
  return (
    pathname.startsWith("/accept-invitation") ||
    pathname === "/create-organization" ||
    pathname.startsWith("/sign-")
  );
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useQuery(api.employees.getMyOnboardingStatus);

  useEffect(() => {
    if (isExemptPath(pathname)) return;
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
  }, [status, pathname, router]);

  if (status === undefined) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
