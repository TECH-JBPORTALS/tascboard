'use client'

import { RiArrowLeftSLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { getEmployeeDisplayName } from '@/lib/employee-onboarding'
import { Button } from '../ui/button'
import { UserAvatar } from './user-avatar'

export function BackToEmployeeButton({ employeeId }: { employeeId: string }) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const router = useRouter()
  const employee = useQuery(api.employees.getEmployeeDetails, { employeeId })
  const href = `/${orgSlug}/employees/${employeeId}`

  if (!employee) return null

  const displayName = getEmployeeDisplayName({
    profile: employee.profile,
    name: employee.name,
    email: employee.email,
  })
  const imageUrl = employee.profilePhotoUrl ?? employee.image

  return (
    <Button
      variant="ghost"
      size="lg"
      className="absolute top-3.5 -left-32 rounded-full"
      onClick={() => router.push(href, { transitionTypes: ['popstate'] })}
    >
      <RiArrowLeftSLine className="text-muted-foreground" />
      <UserAvatar name={displayName} imageUrl={imageUrl} className="size-5" />
      <span>{displayName}</span>
    </Button>
  )
}
