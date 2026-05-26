'use client'

import { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import type { OrgRole } from '@/lib/permissions'
import type { InvitationRow } from './invitations-columns'

type InvitationRowActionsProps = {
  invitation: InvitationRow
  organizationId: string
  onRequestCancel: (invitation: InvitationRow) => void
}

export const InvitationRowActions = memo(function InvitationRowActions({
  invitation,
  organizationId,
  onRequestCancel,
}: InvitationRowActionsProps) {
  const [pending, setPending] = useState<'resend' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    setError(null)
    setPending('resend')
    try {
      const role = (invitation.role ?? 'employee') as OrgRole
      const result = await authClient.organization.inviteMember({
        email: invitation.email,
        role,
        organizationId,
        resend: true,
      })

      if (result.error) {
        setError(result.error.message ?? 'Failed to resend invitation')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend invitation')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending !== null}
          onClick={() => void handleResend()}
        >
          {pending === 'resend' ? 'Sending...' : 'Resend'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={pending !== null}
          onClick={() => onRequestCancel(invitation)}
        >
          Cancel
        </Button>
      </div>
      {error ? (
        <p className="max-w-48 truncate text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  )
})
