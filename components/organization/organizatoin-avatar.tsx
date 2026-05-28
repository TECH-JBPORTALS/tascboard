'use client'

import { RiBuilding2Fill } from '@remixicon/react'
import { useOrganizationImageUrl } from '@/hooks/use-organization-image'
import { cn } from '@/lib/utils'

export function OrganizationAvatar({
  name,
  imageStorageId,
  className,
}: {
  name: string
  imageStorageId?: string
  className?: string
}) {
  const imageUrl = useOrganizationImageUrl(imageStorageId)

  return (
    <div
      className={cn(
        'flex size-8 border shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent/50 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {imageUrl ? (
        // biome-ignore lint/performance/noImgElement: <No need of Next Image>
        <img src={imageUrl} alt={name} className="size-full object-cover" />
      ) : imageUrl === undefined ? (
        <span className="size-4 animate-pulse rounded bg-muted-foreground/20" />
      ) : (
        <RiBuilding2Fill className="size-4" />
      )}
    </div>
  )
}
