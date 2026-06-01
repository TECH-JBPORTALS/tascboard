import { notFound, redirect } from 'next/navigation'
import { OrganizationAccessProvider } from '@/components/organization/organization-access-provider'
import { api } from '@/convex/_generated/api'
import {
  fetchAuthMutation,
  fetchAuthQuery,
  preloadAuthQuery,
} from '@/lib/auth-server'
import { findOrganizationBySlug } from '@/lib/organization-membership'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const [organizationList, activeOrganization] = await Promise.all([
    fetchAuthQuery(api.auth.listOrganizations),
    fetchAuthQuery(api.auth.getActiveOrganization),
  ])

  if (organizationList.length === 0) {
    redirect('/create-organization')
  }

  const targetOrganization = findOrganizationBySlug(organizationList, orgSlug)

  if (!targetOrganization) {
    notFound()
  }

  if (activeOrganization?.id !== targetOrganization.id) {
    await fetchAuthMutation(api.auth.setActiveOrganization, {
      organizationId: targetOrganization.id,
    })
  }

  const preloadedMemberRoleQuery = await preloadAuthQuery(
    api.auth.getActiveMemberRole,
  )

  return (
    <OrganizationAccessProvider
      preloadedMemberRoleQuery={preloadedMemberRoleQuery}
    >
      <main className="flex flex-1 flex-col">{children}</main>
    </OrganizationAccessProvider>
  )
}
