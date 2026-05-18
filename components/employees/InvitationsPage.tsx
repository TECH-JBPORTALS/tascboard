"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";
import {
  invitationColumns,
  type InvitationRow,
} from "./invitations-columns";
import { EmployeesDataTable } from "./employees-data-table";

export function InvitationsPage() {
  const { allowed, isLoading: permissionLoading } = usePermission({
    employee: ["list"],
  });
  const invitations = useQuery(
    api.employees.listPendingInvitations,
    allowed ? {} : "skip",
  );

  const rows = useMemo<InvitationRow[]>(() => {
    if (!invitations) return [];
    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
    }));
  }, [invitations]);

  if (!permissionLoading && !allowed) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <p className="text-muted-foreground">
          You do not have permission to view invitations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      {invitations === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pending invitations.
        </p>
      ) : (
        <EmployeesDataTable columns={invitationColumns} data={rows} />
      )}
    </div>
  );
}
