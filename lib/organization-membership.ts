import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/betterAuth/_generated/dataModel'

export type OrganizationListItem = {
  id: string
  name: string
  slug: string
  metadata?: string | Record<string, unknown> | null
}

export type OrganizationDestination =
  | { type: 'create' }
  | { type: 'select' }
  | { type: 'organization'; organization: OrganizationListItem }

export function findOrganizationById(
  orgList: OrganizationListItem[],
  organizationId: string | null | undefined,
): OrganizationListItem | undefined {
  if (!organizationId) return undefined
  return orgList.find((org) => org.id === organizationId)
}

export function findOrganizationBySlug(
  orgList: NonNullable<typeof api.auth.listOrganizations._returnType>,
  slug: string,
):
  | NonNullable<typeof api.auth.listOrganizations._returnType>[number]
  | undefined {
  return orgList.find((org) => org.slug === slug)
}

/** Where authenticated users without a valid org context should land. */
export function resolveOrganizationDestination(
  orgList: OrganizationListItem[],
  activeOrganizationId: string | null | undefined,
): OrganizationDestination {
  if (orgList.length === 0) {
    return { type: 'create' }
  }

  if (orgList.length === 1) {
    return { type: 'organization', organization: orgList[0] }
  }

  const active = findOrganizationById(orgList, activeOrganizationId)
  if (active) {
    return { type: 'organization', organization: active }
  }

  return { type: 'select' }
}

export function organizationPath(destination: OrganizationDestination): string {
  switch (destination.type) {
    case 'create':
      return '/create-organization'
    case 'select':
      return '/select-organization'
    case 'organization':
      return `/${destination.organization.slug}`
  }
}
