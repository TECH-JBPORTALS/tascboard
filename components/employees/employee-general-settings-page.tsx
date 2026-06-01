'use client'

import { RiAddLine } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  getEmployeeDisplayName,
  isEmployeeOnboarded,
} from '@/lib/employee-onboarding'
import { usePermission } from '@/hooks/use-permission'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '../ui/card'
import { Spinner } from '../ui/spinner'
import { UserAvatar } from './user-avatar'

type EmployeeGeneralSettingsPageProps = {
  employeeId: string
}

export function EmployeeGeneralSettingsPage({
  employeeId,
}: EmployeeGeneralSettingsPageProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const { allowed } = usePermission({
    organization: ['delete'],
  })
  const employee = useQuery(
    api.employees.getEmployeeDetails,
    allowed ? { employeeId } : 'skip',
  )
  const updateGeneral = useMutation(api.employees.adminUpdateEmployeeGeneral)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  const profile = employee?.profile

  useEffect(() => {
    if (!profile) return
    setFirstName(profile.firstName ?? '')
    setLastName(profile.lastName ?? '')
    setDateOfBirth(profile.dateOfBirth ?? '')
    setAddress(profile.address ?? '')
  }, [profile])

  async function uploadFile(file: File): Promise<Id<'_storage'>> {
    const uploadUrl = await generateUploadUrl({})
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const { storageId } = (await response.json()) as {
      storageId: Id<'_storage'>
    }
    return storageId
  }

  async function saveGeneral(patch?: { profilePhotoStorageId?: Id<'_storage'> }) {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedAddress = address.trim()

    if (!trimmedFirst || !trimmedLast) {
      toast.error('First and last name are required')
      return
    }
    if (!dateOfBirth) {
      toast.error('Date of birth is required')
      return
    }
    if (trimmedAddress.length < 5) {
      toast.error('Address is required')
      return
    }

    setIsSaving(true)
    try {
      await updateGeneral({
        employeeId,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        dateOfBirth,
        address: trimmedAddress,
        ...patch,
      })
      toast.success('General information updated')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update general information',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file')
      return
    }

    setIsUploadingPhoto(true)
    try {
      const storageId = await uploadFile(file)
      await saveGeneral({ profilePhotoStorageId: storageId })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update profile photo',
      )
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">
        You do not have permission to manage employees.
      </p>
    )
  }

  if (employee === undefined) {
    return <GeneralSettingsLoading />
  }

  if (employee === null) {
    return (
      <p className="text-sm text-muted-foreground">Employee not found.</p>
    )
  }

  const displayName = getEmployeeDisplayName({
    profile: employee.profile,
    name: employee.name,
    email: employee.email,
  })
  const imageUrl = employee.profilePhotoUrl ?? employee.image
  const onboardingComplete = isEmployeeOnboarded(employee.profile)
  const hubHref = `/${orgSlug}/employees/${employeeId}`

  if (!onboardingComplete) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">General</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Profile details for {displayName}.
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <p>This employee has not completed onboarding yet.</p>
            <p className="mt-2">
              <Link href={hubHref} className="text-foreground underline">
                Back to employee settings
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">General</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name, date of birth, address, and organization profile photo for{' '}
          {displayName}.
        </p>
      </div>

      <Card>
        <CardContent>
          <FieldSet className="grid grid-cols-4">
            <div className="col-span-3">
              <FieldLegend>Profile photo</FieldLegend>
              <FieldDescription>
                Photo for this organization only. Does not change the
                employee&apos;s global account avatar.
              </FieldDescription>
            </div>
            <div className="col-span-1 flex items-center justify-end">
              <button
                type="button"
                className="relative group"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto || isSaving}
              >
                <UserAvatar
                  name={displayName}
                  imageUrl={imageUrl}
                  className="z-0 size-12"
                />
                <div
                  className={cn(
                    'absolute inset-0 z-20 flex items-center justify-center rounded-full bg-muted/80 opacity-0 group-hover:opacity-100',
                    isUploadingPhoto && 'opacity-100',
                  )}
                >
                  {isUploadingPhoto ? (
                    <Spinner />
                  ) : (
                    <RiAddLine className="size-4" />
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void handlePhotoChange(event)}
              />
            </div>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>First name</FieldLegend>
              <FieldDescription>Employee&apos;s first name.</FieldDescription>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={firstName}
                  disabled={isSaving}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveGeneral()
                  }}
                />
                <InputGroupAddon align="inline-end">
                  {isSaving ? <Spinner className="size-2.5" /> : null}
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Last name</FieldLegend>
              <FieldDescription>Employee&apos;s last name.</FieldDescription>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={lastName}
                  disabled={isSaving}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveGeneral()
                  }}
                />
                <InputGroupAddon align="inline-end">
                  {isSaving ? <Spinner className="size-2.5" /> : null}
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Date of birth</FieldLegend>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  type="date"
                  value={dateOfBirth}
                  disabled={isSaving}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6 gap-3">
            <div className="col-span-4">
              <FieldLegend>Address</FieldLegend>
            </div>
            <Field className="col-span-2">
              <Textarea
                value={address}
                disabled={isSaving}
                rows={3}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent className="flex justify-end">
          <Button
            size="sm"
            disabled={isSaving || isUploadingPhoto}
            onClick={() => void saveGeneral()}
          >
            {isSaving ? <Spinner className="size-4" /> : null}
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function GeneralSettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Card>
        <CardContent className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
