import { notFound, redirect } from 'next/navigation'
import { OrganizationAccessProvider } from '@/components/organization/organization-access-provider'
import { api } from '@/convex/_generated/api'
import { fetchAuthQuery, preloadAuthQuery } from '@/lib/auth-server'
import { findOrganizationBySlug } from '@/lib/organization-membership'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const [organizationList] = await Promise.all([
    fetchAuthQuery(api.auth.listOrganizations),
  ])

  if (organizationList.length === 0) {
    redirect('/create-organization')
  }

  const targetOrganization = findOrganizationBySlug(organizationList, orgSlug)

  if (!targetOrganization) {
    notFound()
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
