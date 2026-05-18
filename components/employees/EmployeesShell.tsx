"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { RiTeamLine } from "@remixicon/react";
import { authClient } from "@/lib/auth-client";
import { PageHeader } from "@/components/ui/page-header";
import { InviteEmployeeDialog } from "./InviteEmployeeDialog";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { cn } from "@/lib/utils";

const subNavItems = [
  { label: "Employees", segment: "" },
  { label: "Invitations", segment: "/invitations" },
] as const;

export function EmployeesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ orgSlug: string }>();
  const basePath = `/${params.orgSlug}/employees`;
  const { data: organization } = authClient.useActiveOrganization();
  const org = organization as { id: string } | null | undefined;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        icon={<RiTeamLine />}
        title="Employees"
        description="Manage organization members and invitations"
        actions={
          org?.id ? (
            <PermissionGate permissions={{ employee: ["invite"] }}>
              <InviteEmployeeDialog organizationId={org.id} />
            </PermissionGate>
          ) : null
        }
      />

      <nav
        className="flex gap-1 border-b border-border/60 px-4 md:px-6"
        aria-label="Employees sections"
      >
        {subNavItems.map((item) => {
          const href = `${basePath}${item.segment}`;
          const isActive =
            item.segment === ""
              ? pathname === basePath || pathname === `${basePath}/`
              : pathname.startsWith(href);

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "relative px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
