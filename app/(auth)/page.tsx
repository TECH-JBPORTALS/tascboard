import { OrgSlugGuard } from '@/components/organization/org-slug-guard'
import { api } from '@/convex/_generated/api'
import { preloadAuthQuery } from '@/lib/auth-server'

export default async function Page() {
  const [preloadedOrganizatoinsQuery, preloadedActiveOrganizationQuery] =
    await Promise.all([
      preloadAuthQuery(api.auth.listOrganizations),
      preloadAuthQuery(api.auth.getActiveOrganization),
    ])

  return (
    <OrgSlugGuard
      preloadedOrganizationsQuery={preloadedOrganizatoinsQuery}
      preloadedActiveOrganizationQuery={preloadedActiveOrganizationQuery}
    />
  )
}
