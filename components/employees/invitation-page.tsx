'use client'

import { useQuery } from 'convex/react'
import { useCallback, useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { usePermission } from '@/hooks/use-permission'
import { authClient } from '@/lib/auth-client'
import type { PermissionRequest } from '@/lib/permissions'
import { DataTable } from '../data-table'
import { CancelInvitationDialog } from './cancell-invitation-dialog'
import {
  createInvitationColumns,
  type InvitationRow,
  invitationColumnsWithoutActions,
} from './invitations-columns'

const ownerPermissions: PermissionRequest = { organization: ['delete'] }

export function InvitationsPage() {
  const { allowed } = usePermission(ownerPermissions)
  const canInvite = allowed
  const { data: organization } = authClient.useActiveOrganization()
  const orgId = (organization as { id: string } | null | undefined)?.id

  const invitations = useQuery(
    api.employees.listInvitations,
    allowed ? {} : 'skip',
  )

  const [cancelTarget, setCancelTarget] = useState<InvitationRow | null>(null)

  const handleRequestCancel = useCallback((invitation: InvitationRow) => {
    setCancelTarget(invitation)
  }, [])

  const handleCloseCancel = useCallback(() => {
    setCancelTarget(null)
  }, [])

  const rows = useMemo<InvitationRow[]>(() => {
    if (!invitations) return []
    return invitations
  }, [invitations])

  const columns = useMemo(() => {
    if (canInvite && orgId) {
      return createInvitationColumns({
        organizationId: orgId,
        onRequestCancel: handleRequestCancel,
      })
    }
    return invitationColumnsWithoutActions
  }, [canInvite, orgId, handleRequestCancel])

  if (!allowed) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <p className="text-muted-foreground">
          You do not have permission to view invitations.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      {invitations === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending invitations.</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      {canInvite ? (
        <CancelInvitationDialog
          invitation={cancelTarget}
          onClose={handleCloseCancel}
        />
      ) : null}
    </div>
  )
}
