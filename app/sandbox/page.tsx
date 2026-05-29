import { AcceptInvitation } from '@/components/invitation/accept-invitation'

export default function Page() {
  return (
    <AcceptInvitation
      invitation={{
        email: 'walter@white.com',
        organizationName: 'JB PORTALS',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        id: '123',
        organizationId: '123',
        role: 'employee',
        status: 'pending',
        inviterId: '123',
        inviterEmail: 'gus@fring.com',
        organizationSlug: 'jb-portals',
        user: {
          id: '123',
          email: 'walter@white.com',
          name: 'Walter White',
          image: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: true,
        },
      }}
      onAcceptInvitation={() => Promise.resolve()}
      onSignOut={() => Promise.resolve()}
      onSignIn={() => {}}
    />
  )
}
