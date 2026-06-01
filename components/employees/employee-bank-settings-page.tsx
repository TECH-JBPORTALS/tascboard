'use client'

import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { usePermission } from '@/hooks/use-permission'
import {
  getEmployeeDisplayName,
  isEmployeeOnboarded,
} from '@/lib/employee-onboarding'
import { Card, CardContent } from '../ui/card'
import { Spinner } from '../ui/spinner'

const bankDetailsSchema = z.object({
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar must be 12 digits'),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, 'Enter a valid PAN'),
  bankAccountNumber: z.string().min(8, 'Account number is required'),
  bankName: z.string().min(2, 'Bank name is required'),
  ifscCode: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Enter a valid IFSC code'),
  branchName: z.string().min(2, 'Branch name is required'),
})

type EmployeeBankSettingsPageProps = {
  employeeId: string
}

export function EmployeeBankSettingsPage({
  employeeId,
}: EmployeeBankSettingsPageProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const { allowed } = usePermission({
    organization: ['delete'],
  })
  const employee = useQuery(
    api.employees.getEmployeeDetails,
    allowed ? { employeeId } : 'skip',
  )
  const updateBankDetails = useMutation(
    api.employees.adminUpdateEmployeeBankDetails,
  )

  const [aadharNumber, setAadharNumber] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [branchName, setBranchName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const profile = employee?.profile

  useEffect(() => {
    if (!profile) return
    setAadharNumber(profile.aadharNumber ?? '')
    setPanNumber(profile.panNumber ?? '')
    setBankAccountNumber(profile.bankAccountNumber ?? '')
    setBankName(profile.bankName ?? '')
    setIfscCode(profile.ifscCode ?? '')
    setBranchName(profile.branchName ?? '')
  }, [profile])

  async function handleSave() {
    const parsed = bankDetailsSchema.safeParse({
      aadharNumber,
      panNumber,
      bankAccountNumber,
      bankName,
      ifscCode,
      branchName,
    })

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid bank details')
      return
    }

    setIsSaving(true)
    try {
      await updateBankDetails({
        employeeId,
        aadharNumber: parsed.data.aadharNumber,
        panNumber: parsed.data.panNumber,
        bankAccountNumber: parsed.data.bankAccountNumber,
        bankName: parsed.data.bankName,
        ifscCode: parsed.data.ifscCode,
        branchName: parsed.data.branchName,
      })
      toast.success('Bank details updated')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update bank details',
      )
    } finally {
      setIsSaving(false)
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
    return <BankSettingsLoading />
  }

  if (employee === null) {
    return <p className="text-sm text-muted-foreground">Employee not found.</p>
  }

  const displayName = getEmployeeDisplayName({
    profile: employee.profile,
    name: employee.name,
    email: employee.email,
  })
  const onboardingComplete = isEmployeeOnboarded(employee.profile)
  const hubHref = `/${orgSlug}/employees/${employeeId}`

  if (!onboardingComplete) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">Bank details</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compliance and payroll details for {displayName}.
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
        <h1 className="text-xl font-semibold">Bank details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Government ID and bank account for {displayName}.
        </p>
      </div>

      <Card>
        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Aadhar number</FieldLegend>
              <FieldDescription>12-digit Aadhar number.</FieldDescription>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={aadharNumber}
                  disabled={isSaving}
                  onChange={(e) => setAadharNumber(e.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>PAN number</FieldLegend>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={panNumber}
                  disabled={isSaving}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                />
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Bank account number</FieldLegend>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={bankAccountNumber}
                  disabled={isSaving}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Bank name</FieldLegend>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={bankName}
                  disabled={isSaving}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>IFSC code</FieldLegend>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={ifscCode}
                  disabled={isSaving}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                />
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent>
          <FieldSet className="grid grid-cols-6">
            <div className="col-span-4">
              <FieldLegend>Branch name</FieldLegend>
            </div>
            <Field className="col-span-2 flex-row items-center justify-end">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={branchName}
                  disabled={isSaving}
                  onChange={(e) => setBranchName(e.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldSet>
        </CardContent>

        <Separator />

        <CardContent className="flex justify-end">
          <Button
            size="sm"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? <Spinner className="size-4" /> : null}
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function BankSettingsLoading() {
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
