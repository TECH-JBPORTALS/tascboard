'use client'

import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckboxCircleFill,
} from '@remixicon/react'
import { useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { usePermission } from '@/hooks/use-permission'
import {
  getEmployeeDisplayName,
  isEmployeeOnboarded,
} from '@/lib/employee-onboarding'
import { Card, CardContent } from '../ui/card'
import { EmployeeDangerZoneSection } from './employee-danger-zone-section'
import { UserAvatar } from './user-avatar'

const settingsSections = [
  {
    label: 'General',
    description: 'Name, date of birth, address, and profile photo.',
    href: 'general',
  },
  {
    label: 'Bank details',
    description: 'Aadhar, PAN, and salary bank account.',
    href: 'bank-details',
  },
] as const

type EmployeeSettingsHubPageProps = {
  employeeId: string
}

export function EmployeeSettingsHubPage({
  employeeId,
}: EmployeeSettingsHubPageProps) {
  const router = useRouter()
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const { allowed } = usePermission({
    organization: ['delete'],
  })
  const employee = useQuery(
    api.employees.getEmployeeDetails,
    allowed ? { employeeId } : 'skip',
  )

  if (!allowed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted-foreground">
          You do not have permission to manage employees.
        </p>
        <Button
          render={<Link href={`/${orgSlug}/employees`} />}
          nativeButton={false}
        >
          Back to employees
        </Button>
      </div>
    )
  }

  if (employee === undefined) {
    return <EmployeeSettingsHubLoading />
  }

  if (employee === null) {
    return (
      <div className="text-sm text-muted-foreground">Employee not found.</div>
    )
  }

  const displayName = getEmployeeDisplayName({
    profile: employee.profile,
    name: employee.name,
    email: employee.email,
  })
  const imageUrl = employee.image
  const onboardingComplete = isEmployeeOnboarded(employee.profile)
  const basePath = `/${orgSlug}/employees/${employeeId}`

  return (
    <div className="flex flex-col gap-6">
      <Button
        onClick={() => router.push(`/${orgSlug}/employees`)}
        variant={'ghost'}
        className={'w-fit rounded-full -translate-x-6'}
        size={'lg'}
      >
        <RiArrowLeftSLine /> Back to employees
      </Button>
      <div className="flex justify-between px-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold">{displayName}</h1>
            <Badge variant={employee.active ? 'secondary' : 'outline'}>
              {employee.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{employee.email}</p>
        </div>

        <UserAvatar
          name={displayName}
          imageUrl={imageUrl}
          className="size-12 shrink-0"
        />
      </div>

      <Card>
        <CardContent className="space-y-3">
          {onboardingComplete ? (
            <div className="flex items-center gap-2 text-sm">
              <RiCheckboxCircleFill className="size-4 text-primary" />
              <span>Onboarding complete</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This employee has not completed onboarding yet. General and bank
              settings will be available once they finish.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        {settingsSections.map((section, index) => {
          const href = `${basePath}/${section.href}`

          return (
            <React.Fragment key={section.href}>
              {index > 0 ? <Separator /> : null}
              <Link href={href} className="h-full">
                <CardContent className="h-full py-4 hover:bg-accent/40">
                  <Field orientation="horizontal">
                    <FieldSet className="min-w-0 flex-1">
                      <FieldLegend>{section.label}</FieldLegend>
                      <FieldDescription>{section.description}</FieldDescription>
                    </FieldSet>
                    <RiArrowRightSLine className="size-5 shrink-0 text-muted-foreground" />
                  </Field>
                </CardContent>
              </Link>
            </React.Fragment>
          )
        })}
      </Card>

      <EmployeeDangerZoneSection
        employeeId={employeeId}
        employeeName={displayName}
        active={employee.active}
      />
    </div>
  )
}

function EmployeeSettingsHubLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between px-2.5">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>
      <Card>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
