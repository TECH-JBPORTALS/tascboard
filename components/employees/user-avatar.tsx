'use client'

import { RiUser3Line } from '@remixicon/react'
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
  return (
    <Avatar
      {...props}
      className={cn(className, 'after:overflow-hidden overflow-hidden')}
    >
      <AvatarImage src={imageUrl ?? ''} className={'rounded-none'} alt={name} />
      <AvatarFallback className={'rounded-none'}>
        <RiUser3Line />
      </AvatarFallback>
    </Avatar>
  )
}
