'use client'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AcceptInvitation } from '@/components/invitation/accept-invitation'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/convex/_generated/api'
import { authClient } from '@/lib/auth-client'

export function AcceptInvitationPage() {
  const params = useParams<{ invitationId: string }>()
  const invitationId = params.invitationId
  const router = useRouter()
  const invitation = useQuery(api.employees.getInvitationById, {
    invitationId: invitationId,
  })

  if (invitation === undefined) {
    return (
      <div className="flex flex-col gap-4 h-svh items-center justify-center">
        <Spinner className="size-6" />
        <p className="text-muted-foreground">Loading invitation...</p>
      </div>
    )
  }

  return (
    <AcceptInvitation
      invitation={invitation}
      onAcceptInvitation={async () => {
        await authClient.organization.acceptInvitation({
          invitationId: invitation.id,
          fetchOptions: {
            onSuccess() {
              router.push(`/${invitation.organizationSlug}`)
            },
            onError(context) {
              toast.error(
                context.error.message ?? 'Failed to accept invitation',
              )
            },
          },
        })
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
