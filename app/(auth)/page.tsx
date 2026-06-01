import { redirect } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { fetchAuthQuery } from '@/lib/auth-server'
import {
  organizationPath,
  resolveOrganizationDestination,
} from '@/lib/organization-membership'

export default async function Page() {
  const [organizations, activeOrganization] = await Promise.all([
    fetchAuthQuery(api.auth.listOrganizations),
    fetchAuthQuery(api.auth.getActiveOrganization),
  ])

  const organizationDestination = resolveOrganizationDestination(
    organizations,
    activeOrganization?.id,
  )

  redirect(organizationPath(organizationDestination))
}
