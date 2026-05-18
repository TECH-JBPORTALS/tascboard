"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { usePermission } from "@/hooks/use-permission";
import type { PermissionRequest } from "@/lib/permissions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createInvitationColumns,
  invitationColumnsWithoutActions,
  type InvitationRow,
} from "./invitations-columns";
import { EmployeesDataTable } from "./employees-data-table";
import { CancelInvitationDialog } from "./CancelInvitationDialog";

const listPermissions: PermissionRequest = { employee: ["list"] };
const invitePermissions: PermissionRequest = { employee: ["invite"] };

export function InvitationsPage() {
  const { allowed, isLoading: permissionLoading } =
    usePermission(listPermissions);
  const { allowed: canInvite } = usePermission(invitePermissions);
  const { data: organization } = authClient.useActiveOrganization();
  const orgId = (organization as { id: string } | null | undefined)?.id;

  const invitations = useQuery(
    api.employees.auth.listPendingInvitations,
    allowed ? {} : "skip",
  );

  const [cancelTarget, setCancelTarget] = useState<InvitationRow | null>(null);

  const handleRequestCancel = useCallback((invitation: InvitationRow) => {
    setCancelTarget(invitation);
  }, []);

  const handleCloseCancel = useCallback(() => {
    setCancelTarget(null);
  }, []);

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

  const columns = useMemo(() => {
    if (canInvite && orgId) {
      return createInvitationColumns({
        organizationId: orgId,
        onRequestCancel: handleRequestCancel,
      });
    }
    return invitationColumnsWithoutActions;
  }, [canInvite, orgId, handleRequestCancel]);

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
        <EmployeesDataTable columns={columns} data={rows} />
      )}

      {canInvite ? (
        <CancelInvitationDialog
          invitation={cancelTarget}
          onClose={handleCloseCancel}
        />
      ) : null}
    </div>
  );
}
