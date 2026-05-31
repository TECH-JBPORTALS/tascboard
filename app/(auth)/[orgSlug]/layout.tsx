import { OrgSlugGuard } from '@/components/organization/org-slug-guard'
import { api } from '@/convex/_generated/api'
import { preloadAuthQuery } from '@/lib/auth-server'

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [
    preloadedOrganizationsQuery,
    preloadedActiveOrganizationQuery,
    preloadedMemberRoleQuery,
  ] = await Promise.all([
    preloadAuthQuery(api.auth.listOrganizations),
    preloadAuthQuery(api.auth.getActiveOrganization),
    preloadAuthQuery(api.auth.getActiveMemberRole),
  ])

  return (
    <OrgSlugGuard
      preloadedOrganizationsQuery={preloadedOrganizationsQuery}
      preloadedActiveOrganizationQuery={preloadedActiveOrganizationQuery}
      preloadedMemberRoleQuery={preloadedMemberRoleQuery}
    >
      <main className="flex flex-1 flex-col">{children}</main>
    </OrgSlugGuard>
  )
}
