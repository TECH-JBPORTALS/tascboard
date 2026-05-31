'use client'

import { RiUser3Fill } from '@remixicon/react'
import React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export function UserAvatar({
  name,
  imageUrl,
  className,
  ...props
}: React.ComponentProps<typeof Avatar> & {
  name: string
  imageUrl?: string | null
}) {
  const initials = name.charAt(0).toUpperCase()

  return (
    <Avatar
      {...props}
      className={cn(className, 'after:overflow-hidden overflow-hidden')}
    >
      <AvatarImage src={imageUrl ?? ''} className={'rounded-none'} alt={name} />
      <AvatarFallback className={'rounded-none'}>
        {initials || <RiUser3Fill className="size-4" />}
      </AvatarFallback>
    </Avatar>
  )
}
