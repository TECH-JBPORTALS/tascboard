'use client'

import { RiTBoxLine } from '@remixicon/react'
import { isBefore } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { Button } from '../ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'

type Invitation = typeof api.employees.getInvitationById._returnType

interface AcceptInvitationProps {
  invitation?: Invitation | null
  onAcceptInvitation: () => Promise<void>
  onSignOut: () => Promise<void>
  onSignIn: () => void
}

export function AcceptInvitation({
  invitation,
  onAcceptInvitation,
  onSignOut,
  onSignIn,
}: AcceptInvitationProps) {
  const { user } = invitation ?? {}
  const [isAccepting, setAccepting] = useState(false)
  const [isSigningOut, setSigningOut] = useState(false)

  if (!invitation)
    return (
      <InvitationStateCard
        title="Invitation not found"
        description="This invitation link is invalid or has been removed."
      />
    )

  // Show not logged in
  if (!user) {
    return (
      <InvitationStateCard
        title="Sign in required"
        description="You need to sign in with your invited email address to accept this invitation."
        footer={
          <Button
            onClick={() => onSignIn()}
            variant={'outline'}
            className={'w-full'}
          >
            Sign in
          </Button>
        }
      />
    )
  }

  // Show email mismatch
  if (user.email !== invitation.email) {
    return (
      <InvitationStateCard
        title="Wrong account"
        description={
          <>
            This invitation is for <b>{invitation.email}</b>. You are currently
            signed in as <b>{user.email}</b>
          </>
        }
        footer={
          <Button
            onClick={() => {
              setSigningOut(true)
              onSignOut()
                .then(() => setSigningOut(false))
                .finally(() => setSigningOut(false))
            }}
            className={'w-full'}
            variant={'outline'}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign out and continue'}
          </Button>
        }
      />
    )
  }

  // Show accepted invitation
  if (invitation.status === 'accepted') {
    const orgHref = invitation.organizationSlug
      ? `/${invitation.organizationSlug}`
      : '/'
    return (
      <InvitationStateCard
        title="Invitation accepted"
        description="This invitation has already been accepted."
        footer={
          <Button
            variant="outline"
            className="w-full"
            render={<Link href={orgHref} />}
            nativeButton={false}
          >
            Go to dashboard
          </Button>
        }
      />
    )
  }

  // Show expired invitation
  if (isBefore(invitation.expiresAt, new Date())) {
    return (
      <InvitationStateCard
        title="Invitation expired"
        description="This invitation has expired. Ask your administrator to send a new one."
      />
    )
  }

  // Show cancelled invitation
  if (invitation.status === 'canceled') {
    return (
      <InvitationStateCard
        title="Invitation canceled"
        description="This invitation has been canceled and can no longer be used."
      />
    )
  }

  // Show rejected invitation
  if (invitation.status === 'rejected') {
    return (
      <InvitationStateCard
        title="Invitation rejected"
        description="This invitation has already been rejected."
      />
    )
  }

  // Accept invitation
  return (
    <InvitationStateCard
      title={`You're invited to ${invitation.organizationName}`}
      description={`Join on Tascboard with ${invitation.email}.`}
      footer={
        <Button
          onClick={() => {
            setAccepting(true)
            onAcceptInvitation()
              .then(() => setAccepting(false))
              .finally(() => setAccepting(false))
          }}
          className={'w-full'}
          disabled={isAccepting}
        >
          {isAccepting ? 'Accepting...' : 'Accept invitation'}
        </Button>
      }
    />
  )
}

function InvitationStateCard({
  title,
  description,
  footer,
}: {
  title: string
  description: React.ReactNode | string
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <RiTBoxLine className="mx-auto mb-4 size-14 text-primary" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>{footer}</CardFooter>
      </Card>
    </div>
  )
}
