'use client'

import { RiArrowRightLine } from '@remixicon/react'
import { useConvex, useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { OrganizationAvatar } from '@/components/organization/organizatoin-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { authClient } from '@/lib/auth-client'

type DerivedView =
  | 'loading'
  | 'not_found'
  | 'expired'
  | 'already_handled'
  | 'email_mismatch'
  | 'sign_in_required'
  | 'ready'

type InvitationPreview = {
  status: string
  email: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  organizationLogo: string | null
  expiresAt: number
  role: string | null
}

function deriveView(
  preview: InvitationPreview | null | undefined,
  sessionEmail: string | undefined,
): DerivedView {
  if (preview === undefined) return 'loading'
  if (preview === null) return 'not_found'

  if (preview.status === 'accepted') return 'already_handled'

  if (
    preview.status === 'canceled' ||
    preview.status === 'cancelled' ||
    preview.status === 'rejected'
  ) {
    return 'already_handled'
  }

  if (preview.expiresAt < Date.now()) return 'expired'

  if (preview.status !== 'pending') return 'already_handled'

  if (!sessionEmail) return 'sign_in_required'

  if (sessionEmail !== preview.email.toLowerCase()) return 'email_mismatch'

  return 'ready'
}

export function AcceptInvitationPage() {
  const params = useParams<{ invitationId: string }>()
  const router = useRouter()
  const convex = useConvex()
  const invitationId = params.invitationId
  const preview = useQuery(api.employees.auth.getInvitationPreview, {
    invitationId,
  })
  const { data: session } = authClient.useSession()
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const returnUrl = `/accept-invitation/${invitationId}`
  const sessionEmail = session?.user.email?.toLowerCase()

  const view = useMemo(
    () => deriveView(preview, sessionEmail),
    [preview, sessionEmail],
  )

  async function handleAccept() {
    if (!preview || view !== 'ready' || isAccepting) return

    setIsAccepting(true)
    setError(null)

    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      })

      if (result.error) {
        setError(result.error.message ?? 'Could not accept invitation')
        return
      }

      await authClient.organization.setActive({
        organizationId: preview.organizationId,
      })

      const onboardingInboxId = await convex.query(
        api.inbox.getOnboardingInboxItemId,
        {},
      )

      if (onboardingInboxId) {
        router.replace(`/${preview.organizationSlug}/in/${onboardingInboxId}`)
      } else {
        router.replace(`/${preview.organizationSlug}`)
      }
    } finally {
      setIsAccepting(false)
    }
  }

  if (view === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    )
  }

  if (preview == null) {
    return (
      <CenteredCard
        title="Invitation not found"
        description="This invitation link is invalid or has been removed."
        action={<Button render={<Link href="/" />}>Go to dashboard</Button>}
      />
    )
  }

  if (view === 'expired') {
    return (
      <CenteredCard
        title="Invitation expired"
        description="Ask your administrator to send a new invitation."
        action={<Button render={<Link href="/" />}>Go to dashboard</Button>}
      />
    )
  }

  if (view === 'already_handled') {
    return (
      <CenteredCard
        title="Invitation unavailable"
        description={`This invitation has already been ${preview.status}.`}
        action={
          <Button render={<Link href={`/${preview.organizationSlug}`} />}>
            Open organization
          </Button>
        }
      />
    )
  }

  if (view === 'email_mismatch') {
    return (
      <CenteredCard
        title="Wrong account"
        description={`Sign in as ${preview.email} to accept this invitation. You are signed in as ${session?.user.email}.`}
        action={
          <Button
            onClick={() =>
              void authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push(
                      `/sign-in?redirect=${encodeURIComponent(returnUrl)}`,
                    )
                  },
                },
              })
            }
          >
            Sign out and continue
          </Button>
        }
      />
    )
  }

  if (view === 'sign_in_required') {
    const redirect = encodeURIComponent(returnUrl)
    return (
      <CenteredCard
        title={`Join ${preview.organizationName}`}
        description={`Sign in or create an account with ${preview.email} to accept this invitation.`}
        orgName={preview.organizationName}
        badge="Sign in required"
        action={
          <div className="flex w-full flex-col gap-2">
            <Button render={<Link href={`/sign-in?redirect=${redirect}`} />}>
              Sign in
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/sign-up?redirect=${redirect}`} />}
            >
              Create account
            </Button>
          </div>
        }
      />
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <OrganizationAvatar
              name={preview.organizationName}
              imageStorageId={undefined}
              className="mx-auto size-16"
            />
          </div>
          <CardTitle>You&apos;re invited</CardTitle>
          <CardDescription>
            Join{' '}
            <span className="font-medium text-foreground">
              {preview.organizationName}
            </span>{' '}
            on Tascboard with {preview.email}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center text-sm text-muted-foreground">
          <Badge variant="secondary" className="capitalize">
            {preview.role ?? 'employee'}
          </Badge>
          <p>Invited email: {preview.email}</p>
          {error ? <p className="text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={isAccepting}
            onClick={() => void handleAccept()}
          >
            {isAccepting ? 'Accepting...' : 'Accept invitation'}
            <RiArrowRightLine />
          </Button>
          <Button variant="ghost" className="w-full" render={<Link href="/" />}>
            Decline for now
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function CenteredCard({
  title,
  description,
  action,
  orgName,
  badge,
}: {
  title: string
  description: string
  action: React.ReactNode
  orgName?: string
  badge?: string
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {orgName ? (
            <div className="mx-auto mb-4">
              <OrganizationAvatar
                name={orgName}
                imageStorageId={undefined}
                className="mx-auto size-16"
              />
            </div>
          ) : null}
          {badge ? (
            <Badge variant="outline" className="mb-2">
              {badge}
            </Badge>
          ) : null}
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">{action}</CardFooter>
      </Card>
    </div>
  )
}
