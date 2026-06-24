type OrganizationMetadata = {
  address: string
  imageStorageId?: string
}

export function parseOrganizationMetadata(
  metadata: unknown,
): OrganizationMetadata {
  if (!metadata) return { address: '' }

  let raw: Record<string, unknown>
  try {
    raw =
      typeof metadata === 'string'
        ? (JSON.parse(metadata) as Record<string, unknown>)
        : (metadata as Record<string, unknown>)
  } catch {
    return { address: '' }
  }

  return {
    address: typeof raw.address === 'string' ? raw.address : '',
    imageStorageId:
      typeof raw.imageStorageId === 'string' ? raw.imageStorageId : undefined,
  }
}

export function buildOrganizationMetadata(data: OrganizationMetadata) {
  return {
    address: data.address.trim(),
    ...(data.imageStorageId ? { imageStorageId: data.imageStorageId } : {}),
  }
}
