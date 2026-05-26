'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export function useOrganizationImageUrl(
  imageStorageId: string | undefined,
): string | null | undefined {
  const url = useQuery(
    api.files.getUrl,
    imageStorageId ? { storageId: imageStorageId as Id<'_storage'> } : 'skip',
  )

  if (!imageStorageId) {
    return null
  }

  return url
}
