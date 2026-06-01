export type OrganizationListItem = {
  id: string
  name: string
  slug: string
  metadata?: string | Record<string, unknown> | null
}

export type OrganizationDestination =
  | { type: 'create' }
  | { type: 'organization'; organization: OrganizationListItem }

export function findOrganizationById(
  orgList: OrganizationListItem[],
  organizationId: string | null | undefined,
): OrganizationListItem | undefined {
  if (!organizationId) return undefined
  return orgList.find((org) => org.id === organizationId)
}

export function findOrganizationBySlug(
  orgList: OrganizationListItem[],
  slug: string,
): OrganizationListItem | undefined {
  return orgList.find((org) => org.slug === slug)
}

/** Pick the org to activate: URL slug, then session active, then first in list. */
export function resolveTargetOrganization(
  orgList: OrganizationListItem[],
  slug: string | undefined,
  activeOrganizationId: string | null | undefined,
): OrganizationListItem | undefined {
  if (orgList.length === 0) return undefined

  const bySlug = slug ? findOrganizationBySlug(orgList, slug) : undefined
  if (bySlug) return bySlug

  const byActive = findOrganizationById(orgList, activeOrganizationId)
  if (byActive) return byActive

  return orgList[0]
}

/** Where authenticated users without a valid org context should land. */
export function resolveOrganizationDestination(
  orgList: OrganizationListItem[],
  activeOrganizationId: string | null | undefined,
): OrganizationDestination {
  if (orgList.length === 0) {
    return { type: 'create' }
  }

  const target = resolveTargetOrganization(
    orgList,
    undefined,
    activeOrganizationId,
  )
  return { type: 'organization', organization: target! }
}

export function organizationPath(destination: OrganizationDestination): string {
  switch (destination.type) {
    case 'create':
      return '/create-organization'
    case 'organization':
      return `/${destination.organization.slug}`
  }
}
