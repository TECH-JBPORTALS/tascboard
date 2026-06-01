'use client'

import { useConvex } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AcceptInvitation } from '@/components/invitation/accept-invitation'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/convex/_generated/api'
import { authClient } from '@/lib/auth-client'

export function AcceptInvitationPage() {
  const params = useParams<{ invitationId: string }>()
  const invitationId = params.invitationId
  const router = useRouter()
  const convex = useConvex()
  const invitation = useQuery(api.employees.getInvitationById, {
    invitationId,
  })
  const [isAccepting, setIsAccepting] = useState(false)

  if (invitation === undefined) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4">
        <Spinner className="size-6" />
        <p className="text-muted-foreground">Loading invitation...</p>
      </div>
    )
  }

  return (
    <AcceptInvitation
      invitation={invitation}
      onAcceptInvitation={async () => {
        if (!invitation || isAccepting) return

        const organizationId = invitation.organizationId
        const organizationSlug = invitation.organizationSlug

        if (!organizationSlug) {
          toast.error('Organization not found for this invitation')
          return
        }

        setIsAccepting(true)
        try {
          const result = await authClient.organization.acceptInvitation({
            invitationId: invitation.id,
          })

          if (result.error) {
            toast.error(
              result.error.message ?? 'Failed to accept invitation',
            )
            return
          }

          await authClient.organization.setActive({
            organizationId,
          })

          const onboardingInboxId = await convex.query(
            api.inbox.getOnboardingInboxItemId,
            {},
          )

          if (onboardingInboxId) {
            router.replace(`/${organizationSlug}/in/${onboardingInboxId}`)
          } else {
            router.replace(`/${organizationSlug}`)
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to accept invitation',
          )
        } finally {
          setIsAccepting(false)
        }
      }}
      onSignIn={() => {
        router.push(
          `/sign-in?redirect=${encodeURIComponent(window.location.href)}`,
        )
      }}
      onSignOut={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess() {
              router.push(
                `/sign-in?redirect=${encodeURIComponent(window.location.href)}`,
              )
            },
            onError(context) {
              toast.error(context.error.message ?? 'Failed to sign out')
            },
          },
        })
      }}
    />
  )
}
