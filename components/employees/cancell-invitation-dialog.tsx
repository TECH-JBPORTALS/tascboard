'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { authClient } from '@/lib/auth-client'
import type { InvitationRow } from './invitations-columns'

export function CancelInvitationDialog({
  invitation,
  onClose,
}: {
  invitation: InvitationRow | null
  onClose: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    if (!invitation) return
    setError(null)
    setPending(true)
    try {
      const result = await authClient.organization.cancelInvitation({
        invitationId: invitation._id,
      })

      if (result.error) {
        setError(result.error.message ?? 'Failed to cancel invitation')
        return
      }

      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel invitation')
    } finally {
      setPending(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null)
      setPending(false)
      onClose()
    }
  }

  return (
    <AlertDialog open={invitation !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            {invitation
              ? `This will revoke the invitation for ${invitation.email}. They will no longer be able to join using this invite link.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            Keep invitation
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => void handleCancel()}
          >
            {pending ? 'Canceling...' : 'Cancel invitation'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
