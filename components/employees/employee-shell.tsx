'use client'

import { RiTeamLine } from '@remixicon/react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { PageHeader } from '@/components/ui/page-header'
import { authClient } from '@/lib/auth-client'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { InviteEmployeeDialog } from './invite-employees-dialog'

const subNavItems = [
  { label: 'Employees', segment: '' },
  { label: 'Invitations', segment: '/invitations' },
] as const

export function EmployeesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const params = useParams<{ orgSlug: string }>()
  const basePath = `/${params.orgSlug}/employees`
  const { data: organization } = authClient.useActiveOrganization()
  const org = organization as { id: string } | null | undefined

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        icon={<RiTeamLine />}
        title="Employees"
        description="Manage employees and invitations"
        actions={
          org?.id ? (
            <PermissionGate permissions={{ employee: ['invite'] }}>
              <InviteEmployeeDialog organizationId={org.id} />
            </PermissionGate>
          ) : null
        }
      />

      <Tabs value={pathname} className={'w-full border-b bg-accent/40'}>
        <TabsList variant={'line'}>
          {subNavItems.map((item) => {
            const href = `${basePath}${item.segment}`

            return (
              <TabsTrigger
                key={item.label}
                value={href}
                render={<Link href={href} />}
                nativeButton={false}
              >
                {item.label}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {children}
    </div>
  )
}
