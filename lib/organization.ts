export type OrganizationMetadata = {
  address: string
  imageStorageId?: string
}

export function parseOrganizationMetadata(
  metadata: string | Record<string, unknown> | null | undefined,
): OrganizationMetadata {
  if (!metadata) {
    return { address: '' }
  }

  let raw: Record<string, unknown>
  try {
    raw =
      typeof metadata === 'string'
        ? (JSON.parse(metadata) as Record<string, unknown>)
        : metadata
  } catch {
    return { address: '' }
  }

  return {
    address: typeof raw.address === 'string' ? raw.address : '',
    imageStorageId:
      typeof raw.imageStorageId === 'string' ? raw.imageStorageId : undefined,
  }
}

export function buildOrganizationMetadata(
  data: OrganizationMetadata,
): Record<string, string> {
  return {
    address: data.address.trim(),
    ...(data.imageStorageId ? { imageStorageId: data.imageStorageId } : {}),
  }
}

export function slugifyOrganizationName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  return slug || 'organization'
}

export const DELETE_ORGANIZATION_PLEDGE = 'I want to delete this organization'
