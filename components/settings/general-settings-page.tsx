'use client'

import {
  RiAddLine,
  RiComputerLine,
  RiMoonLine,
  RiPencilLine,
  RiSunLine,
} from '@remixicon/react'
import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Field,
  FieldDescription,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../employees/user-avatar'
import { Card, CardContent } from '../ui/card'
import { Spinner } from '../ui/spinner'

const themeOptions = [
  { value: 'system', label: 'System', icon: RiComputerLine },
  { value: 'light', label: 'Light', icon: RiSunLine },
  { value: 'dark', label: 'Dark', icon: RiMoonLine },
] as const

function ThemePreferenceSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Skeleton className="h-24 w-full" />
  }

  return (
    <FieldSet>
      <FieldLegend>Preferences</FieldLegend>
      <FieldDescription>
        Theme applies across the app on this device.
      </FieldDescription>
      <RadioGroup
        value={theme ?? 'system'}
        onValueChange={(value) => setTheme(value)}
        className="grid gap-2 sm:grid-cols-3"
      >
        {themeOptions.map((option) => (
          <Label
            key={option.value}
            htmlFor={`theme-${option.value}`}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5"
          >
            <RadioGroupItem value={option.value} id={`theme-${option.value}`} />
            <option.icon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{option.label}</span>
          </Label>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}

export function GeneralSettingsPage() {
  const settings = useQuery(api.userSettings.getGeneralSettings, {})
  const updateProfileImage = useMutation(api.userSettings.updateProfileImage)
  const updateDisplayName = useMutation(api.userSettings.updateDisplayName)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState('')
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)

  useEffect(() => {
    if (settings?.name !== undefined) {
      setFullName(settings.name)
    }
  }, [settings?.name])

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
      await updateProfileImage({ storageId })
      toast.success('Profile photo updated')
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

  async function handleSaveName() {
    const trimmed = fullName.trim()
    if (!trimmed) {
      toast.error('Full name is required')
      return
    }

    setIsSavingName(true)
    try {
      await updateDisplayName({ fullName: trimmed })
      toast.success('Display name updated')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update display name',
      )
    } finally {
      setIsSavingName(false)
    }
  }

  const name = settings?.name ?? ''
  const email = settings?.email ?? ''
  const image = settings?.image ?? null
  const isLoading = settings === undefined

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">General</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and app preferences.
        </p>
      </div>

      <Card>
        <CardContent>
          <FieldSet className="grid grid-cols-4">
            <div className="col-span-3">
              <FieldLegend>Profile photo</FieldLegend>
              <FieldDescription>
                This photo is tied to your account. Your display name and how
                you appear can differ based on the organization you&apos;re in.
              </FieldDescription>
            </div>
            <div className="flex col-span-1 items-center justify-end">
              {isLoading ? (
                <Skeleton className="size-16 rounded-full" />
              ) : (
                <>
                  <div
                    className="relative group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UserAvatar
                      name={name}
                      imageUrl={image}
                      className={'z-0 size-12'}
                    />
                    <div
                      className={cn(
                        'absolute opacity-0 hover:opacity-100 z-20 rounded-full flex items-center justify-center inset-0 bg-muted/80',
                        isUploadingPhoto && 'opacity-100',
                      )}
                    >
                      {isUploadingPhoto ? (
                        <Spinner />
                      ) : (
                        <RiAddLine className="size-4" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />
                </>
              )}
            </div>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Full name</FieldLegend>
              <FieldDescription>
                Your name in this organization. It can differ from other
                organizations you belong to.
              </FieldDescription>
            </div>
            <Field className="flex-row col-span-2 items-center justify-end">
              {isLoading ? (
                <Skeleton className="h-7 w-full" />
              ) : (
                <div className="flex gap-2">
                  <InputGroup className="flex-1">
                    <InputGroupInput
                      id="full-name"
                      value={fullName}
                      disabled={isSavingName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your full name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName()
                        }
                      }}
                    />
                    <InputGroupAddon align={'inline-end'}>
                      {isSavingName ? <Spinner className={'size-2.5'} /> : null}
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              )}
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Email</FieldLegend>
              <FieldDescription>
                Your account email address. Editing is not available yet.
              </FieldDescription>
            </div>
            <Field className="flex-row col-span-2 items-center justify-end">
              {isLoading ? (
                <Skeleton className="h-7 w-full" />
              ) : (
                <InputGroup>
                  <InputGroupInput
                    id="email"
                    value={email}
                    readOnly
                    className="cursor-default"
                  />
                  <InputGroupAddon align="inline-end">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <InputGroupButton
                            type="button"
                            size="icon-xs"
                            aria-label="Edit email"
                            disabled
                          >
                            <RiPencilLine />
                          </InputGroupButton>
                        }
                      />
                      <TooltipContent>Coming soon</TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
              )}
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <ThemePreferenceSection />
        </CardContent>
      </Card>
    </div>
  )
}
