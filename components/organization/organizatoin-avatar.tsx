'use client'

import { RiBuilding2Fill } from '@remixicon/react'
import { useOrganizationImageUrl } from '@/hooks/use-organization-image'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

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
    <Avatar className={cn('rounded-sm after:rounded-sm', className)} size="sm">
      <AvatarImage
        className={'rounded-sm'}
        src={imageUrl ?? undefined}
        alt={name}
      />
      <AvatarFallback className={'rounded-sm'}>
        <RiBuilding2Fill className="size-4" />
      </AvatarFallback>
    </Avatar>
  )
}
