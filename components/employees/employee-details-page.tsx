'use client'

import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiMapPinLine,
  RiTimeLine,
} from '@remixicon/react'
import { useQuery } from 'convex/react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/convex/_generated/api'
import { usePermission } from '@/hooks/use-permission'
import { UserAvatar } from './user-avatar'

const detailTabs = [
  { label: 'Overview', segment: 'overview' },
  { label: 'Professional', segment: 'professional' },
  { label: 'Leave & Attendance', segment: 'leave-attendance' },
  { label: 'Performance', segment: 'performance' },
  { label: 'Documents', segment: 'documents' },
  { label: 'Activity', segment: 'activity' },
] as const

type EmployeeDetailsPageProps = {
  employeeId: string
  tabSegments?: string[]
}

function resolveTab(tabSegment?: string) {
  return detailTabs.some((tab) => tab.segment === tabSegment)
    ? tabSegment
    : 'overview'
}

function asValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : 'Not provided'
}

function maskValue(value: string | null | undefined) {
  if (!value || value.trim().length === 0) return 'Not provided'
  const trimmed = value.trim()
  if (trimmed.length <= 4) return trimmed
  return `****${trimmed.slice(-4)}`
}

function formatTimestamp(timestamp: number) {
  const ms = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? 'Unknown' : format(date, 'MMM yyyy')
}

function formatDateInput(value: string | null | undefined) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d, yyyy')
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

export function EmployeeDetailsPage({
  employeeId,
  tabSegments,
}: EmployeeDetailsPageProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const { allowed, isLoading: permissionLoading } = usePermission({
    employee: ['list'],
  })
  const employee = useQuery(
    api.employees.getEmployeeDetails,
    allowed ? { employeeId } : 'skip',
  )

  const requestedTab = Array.isArray(tabSegments) ? tabSegments[0] : undefined
  const activeTab = resolveTab(requestedTab)
  const basePath = `/${orgSlug}/employees/${employeeId}`
  const activeTabHref = `${basePath}/${activeTab}`

  if (!permissionLoading && !allowed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted-foreground">
          You do not have permission to view employee details.
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
    return <EmployeeDetailsLoading />
  }

  if (employee === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button
          render={<Link href={`/${orgSlug}/employees`} />}
          nativeButton={false}
        >
          Back to employees
        </Button>
      </div>
    )
  }

  const profile = employee.profile
  const profileName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  const fullName = profileName || employee.name
  const location = asValue(profile?.address)
  const localTime = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
  const joined = formatTimestamp(employee.createdAt)

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link href={`/${orgSlug}/employees`} />}
              nativeButton={false}
            >
              <RiArrowLeftLine />
            </Button>
            <UserAvatar name={fullName} imageUrl={employee.image} />
            <span className="truncate">{fullName}</span>
            <Badge variant={employee.active ? 'secondary' : 'outline'}>
              {employee.active ? 'Active' : 'Inactive'}
            </Badge>
          </span>
        }
      />

      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <UserAvatar
                  name={fullName}
                  imageUrl={employee.image}
                  className="size-16 rounded-xl after:rounded-xl [&>span]:text-3xl [&>span]:font-semibold"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-semibold">
                      {fullName}
                    </h2>
                    <Badge variant={employee.active ? 'secondary' : 'outline'}>
                      {employee.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm capitalize font-semibold text-muted-foreground">
                    {employee.role}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {employee.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Message</Button>
                <Button variant="outline">Actions</Button>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
              <div className="flex items-center gap-2">
                <RiMapPinLine className="size-4" />
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <RiTimeLine className="size-4" />
                <span>Local time: {localTime}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <RiCalendarLine className="size-4" />
                <span>Joined: {joined}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTabHref} className={'px-4 md:px-6'}>
        <TabsList>
          {detailTabs.map((tab) => {
            const href = `${basePath}/${tab.segment}`
            return (
              <TabsTrigger
                key={tab.segment}
                value={href}
                render={<Link href={href} />}
                nativeButton={false}
              >
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <div className="flex-1 p-4 md:p-6">
        {activeTab === 'overview' ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Identity">
              <FieldRow label="Full name" value={asValue(fullName)} />
              <FieldRow label="Email" value={asValue(employee.email)} />
              <FieldRow label="Role" value={asValue(employee.role)} />
              <FieldRow
                label="Status"
                value={employee.active ? 'Active' : 'Inactive'}
              />
              <FieldRow label="Joined" value={joined} />
            </SectionCard>

            <SectionCard title="Personal Information">
              <FieldRow
                label="Date of birth"
                value={formatDateInput(profile?.dateOfBirth)}
              />
              <FieldRow label="Address" value={asValue(profile?.address)} />
            </SectionCard>

            <SectionCard title="Compliance">
              <FieldRow
                label="Aadhar number"
                value={maskValue(profile?.aadharNumber)}
              />
              <FieldRow
                label="PAN number"
                value={maskValue(profile?.panNumber)}
              />
            </SectionCard>

            <SectionCard title="Banking">
              <FieldRow label="Bank name" value={asValue(profile?.bankName)} />
              <FieldRow
                label="Account number"
                value={maskValue(profile?.bankAccountNumber)}
              />
              <FieldRow label="IFSC code" value={asValue(profile?.ifscCode)} />
              <FieldRow label="Branch" value={asValue(profile?.branchName)} />
            </SectionCard>

            <SectionCard title="Onboarding">
              <FieldRow
                label="Status"
                value={profile?.onboardingStatus ?? 'Not provided'}
              />
              <FieldRow
                label="Current step"
                value={
                  profile ? String(profile.onboardingStep + 1) : 'Not provided'
                }
              />
            </SectionCard>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <p>
                {detailTabs.find((tab) => tab.segment === activeTab)?.label} is
                coming soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function EmployeeDetailsLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b px-4 h-(--header-height) py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
      <div className="space-y-4 p-4 md:p-6">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-44" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-8 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    </div>
  )
}
