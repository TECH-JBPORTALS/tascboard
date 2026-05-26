'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { RemixiconComponentType } from '@remixicon/react'
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBankLine,
  RiCheckboxCircleFill,
  RiEyeLine,
  RiEyeOffLine,
  RiFileShieldLine,
  RiSparklingLine,
  RiUpload2Line,
  RiUserLine,
} from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Controller, type UseFormReturn, useForm } from 'react-hook-form'
import z from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Config & validation
// ---------------------------------------------------------------------------

const ONBOARDING_STEPS = [
  {
    id: 0,
    title: 'About you',
    description: 'Name, date of birth, and address',
    icon: RiUserLine,
    formId: 'onboarding-general',
  },
  {
    id: 1,
    title: 'Government ID',
    description: 'Aadhar and PAN for compliance',
    icon: RiFileShieldLine,
    formId: 'onboarding-gov',
  },
  {
    id: 2,
    title: 'Bank account',
    description: 'Salary disbursement details',
    icon: RiBankLine,
    formId: 'onboarding-bank',
  },
  {
    id: 3,
    title: 'Documents',
    description: 'Certificates & credentials (optional)',
    icon: RiUpload2Line,
    formId: null,
  },
] as const

const LAST_STEP_INDEX = ONBOARDING_STEPS.length - 1

const generalSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(5, 'Address is required'),
})

const govSchema = z.object({
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar must be 12 digits'),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, 'Enter a valid PAN'),
})

const bankSchema = z
  .object({
    bankAccountNumber: z.string().min(8, 'Account number is required'),
    confirmAccountNumber: z.string().min(8, 'Confirm account number'),
    bankName: z.string().min(2, 'Bank name is required'),
    ifscCode: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Enter a valid IFSC code'),
    branchName: z.string().min(2, 'Branch name is required'),
  })
  .refine((d) => d.bankAccountNumber === d.confirmAccountNumber, {
    message: 'Account numbers do not match',
    path: ['confirmAccountNumber'],
  })

type GeneralFormValues = z.infer<typeof generalSchema>
type GovFormValues = z.infer<typeof govSchema>
type BankFormValues = z.infer<typeof bankSchema>

type CertificateEntry = { id: string; fileName: string }

type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

type InboxOnboardingPanelProps = {
  initialStep?: number
  onCompleted?: () => void
}

// ---------------------------------------------------------------------------
// Hook — data, forms, and step actions
// ---------------------------------------------------------------------------

function useInboxOnboarding({
  initialStep = 0,
  onCompleted,
}: InboxOnboardingPanelProps) {
  const status = useQuery(api.employees.profile.getMyOnboardingStatus, {})
  const [step, setStep] = useState(
    Math.min(Math.max(initialStep, 0), LAST_STEP_INDEX),
  )
  const [error, setError] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<CertificateEntry[]>([])
  const [showAccountNumber, setShowAccountNumber] = useState(false)

  const saveGeneral = useMutation(api.employees.profile.saveGeneralInfo)
  const saveGov = useMutation(api.employees.profile.saveGovernmentId)
  const saveBank = useMutation(api.employees.profile.saveBankDetails)
  const addCertificate = useMutation(api.employees.profile.addCertificate)
  const removeCertificate = useMutation(api.employees.profile.removeCertificate)
  const completeOnboarding = useMutation(
    api.employees.profile.completeOnboarding,
  )
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      address: '',
    },
  })

  const govForm = useForm<GovFormValues>({
    resolver: zodResolver(govSchema),
    defaultValues: { aadharNumber: '', panNumber: '' },
  })

  const bankForm = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankAccountNumber: '',
      confirmAccountNumber: '',
      bankName: '',
      ifscCode: '',
      branchName: '',
    },
  })

  const currentStep = ONBOARDING_STEPS[step]
  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100
  const isProfileComplete = status?.onboardingStatus === 'completed'

  function clearError() {
    setError(null)
  }

  function goToStep(index: number) {
    setStep(Math.min(Math.max(index, 0), LAST_STEP_INDEX))
  }

  function handleMutationError(e: unknown, fallback: string) {
    setError(e instanceof Error ? e.message : fallback)
  }

  async function uploadFile(file: File): Promise<Id<'_storage'>> {
    const uploadUrl = await generateUploadUrl({})
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!response.ok) throw new Error('Upload failed')
    const { storageId } = (await response.json()) as {
      storageId: Id<'_storage'>
    }
    return storageId
  }

  async function submitGeneral(values: GeneralFormValues) {
    clearError()
    try {
      await saveGeneral(values)
      goToStep(1)
    } catch (e) {
      handleMutationError(e, 'Failed to save')
    }
  }

  async function submitGovernmentId(values: GovFormValues) {
    clearError()
    try {
      await saveGov({
        aadharNumber: values.aadharNumber,
        panNumber: values.panNumber.toUpperCase(),
      })
      goToStep(2)
    } catch (e) {
      handleMutationError(e, 'Failed to save')
    }
  }

  async function submitBankDetails(values: BankFormValues) {
    clearError()
    try {
      await saveBank({
        bankAccountNumber: values.bankAccountNumber,
        bankName: values.bankName,
        ifscCode: values.ifscCode.toUpperCase(),
        branchName: values.branchName,
      })
      goToStep(3)
    } catch (e) {
      handleMutationError(e, 'Failed to save')
    }
  }

  async function uploadCertificate(file: File) {
    clearError()
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      setError('Only PDF, JPG, JPEG, and PNG files are allowed.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Max file size is 10MB.')
      return
    }
    if (certificates.length >= 5) {
      setError('You can upload at most 5 documents.')
      return
    }

    try {
      const storageId = await uploadFile(file)
      const id = await addCertificate({
        storageId,
        fileName: file.name,
        contentType: file.type,
      })
      setCertificates((prev) => [...prev, { id, fileName: file.name }])
    } catch (e) {
      handleMutationError(e, 'Upload failed')
    }
  }

  async function removeCertificateEntry(
    certificateId: Id<'employeeCertificates'>,
  ) {
    await removeCertificate({ certificateId })
    setCertificates((prev) => prev.filter((c) => c.id !== certificateId))
  }

  async function finishOnboarding() {
    clearError()
    try {
      await completeOnboarding({})
      onCompleted?.()
    } catch (e) {
      handleMutationError(e, 'Failed to complete onboarding')
    }
  }

  return {
    step,
    currentStep,
    progress,
    error,
    isProfileComplete,
    certificates,
    showAccountNumber,
    setShowAccountNumber,
    generalForm,
    govForm,
    bankForm,
    goToStep,
    submitGeneral,
    submitGovernmentId,
    submitBankDetails,
    uploadCertificate,
    removeCertificateEntry,
    finishOnboarding,
  }
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

function OnboardingErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}

function OnboardingCompletedState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <RiCheckboxCircleFill className="size-9" />
      </div>
      <motion.div className="space-y-1">
        <h3 className="font-heading text-xl font-semibold tracking-tight">
          Profile complete
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your employee profile is on file. You can archive this message or
          explore the rest of your inbox.
        </p>
      </motion.div>
    </motion.div>
  )
}

function OnboardingHeader({
  currentStep,
  stepIndex,
  progress,
  onGoToStep,
}: {
  currentStep: OnboardingStep
  stepIndex: number
  progress: number
  onGoToStep: (index: number) => void
}) {
  return (
    <motion.div
      className="relative shrink-0 overflow-hidden border-b border-border/50 px-6 py-8"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/12 via-background to-violet-500/8"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/15 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.55, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative space-y-4">
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <RiSparklingLine className="size-3.5" />
          Employee onboarding
        </motion.div>

        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {currentStep.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentStep.description}
          </p>
        </div>

        <OnboardingStepIndicator
          activeIndex={stepIndex}
          onGoToStep={onGoToStep}
        />

        <OnboardingProgressBar progress={progress} />
      </div>
    </motion.div>
  )
}

function OnboardingStepIndicator({
  activeIndex,
  onGoToStep,
}: {
  activeIndex: number
  onGoToStep: (index: number) => void
}) {
  return (
    <div className="flex gap-2">
      {ONBOARDING_STEPS.map((step, index) => (
        <StepPill
          key={step.id}
          title={step.title}
          icon={step.icon}
          isActive={index === activeIndex}
          isDone={index < activeIndex}
          isDisabled={index > activeIndex}
          onClick={() => index < activeIndex && onGoToStep(index)}
        />
      ))}
    </div>
  )
}

function StepPill({
  title,
  icon: Icon,
  isActive,
  isDone,
  isDisabled,
  onClick,
}: {
  title: string
  icon: RemixiconComponentType
  isActive: boolean
  isDone: boolean
  isDisabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all',
        isActive &&
          'border-primary/40 bg-primary/5 shadow-sm shadow-primary/10',
        isDone && 'border-border/60 bg-muted/30 hover:border-primary/25',
        !isActive && !isDone && 'border-transparent bg-muted/20 opacity-50',
      )}
    >
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
          isActive && 'bg-primary text-primary-foreground',
          isDone && 'bg-primary/15 text-primary',
          !isActive && !isDone && 'bg-muted text-muted-foreground',
        )}
      >
        {isDone ? (
          <RiCheckboxCircleFill className="size-4" />
        ) : (
          <Icon className="size-4" />
        )}
      </span>
      <span className="hidden text-[10px] font-medium leading-tight sm:block">
        {title}
      </span>
    </button>
  )
}

function OnboardingProgressBar({ progress }: { progress: number }) {
  return (
    <motion.div
      className="h-1 overflow-hidden rounded-full bg-muted"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      style={{ transformOrigin: 'left' }}
    >
      <motion.div
        className="h-full rounded-full bg-linear-to-r from-primary to-violet-500"
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </motion.div>
  )
}

function OnboardingFooter({
  stepIndex,
  submitFormId,
  onBack,
  onFinish,
}: {
  stepIndex: number
  submitFormId: string | null
  onBack: () => void
  onFinish: () => void
}) {
  const isLastStep = stepIndex === LAST_STEP_INDEX

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-background/90 px-6 py-4 backdrop-blur-sm">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={stepIndex === 0}
        onClick={onBack}
      >
        <RiArrowLeftLine />
        Back
      </Button>

      {isLastStep ? (
        <Button type="button" size="sm" onClick={onFinish}>
          Finish profile
          <RiSparklingLine />
        </Button>
      ) : (
        <Button type="submit" size="sm" form={submitFormId ?? undefined}>
          Continue
          <RiArrowRightLine />
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step forms
// ---------------------------------------------------------------------------

function GeneralInfoStepForm({
  form,
  onSubmit,
}: {
  form: UseFormReturn<GeneralFormValues>
  onSubmit: (values: GeneralFormValues) => void
}) {
  return (
    <form
      id={ONBOARDING_STEPS[0].formId}
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        <FormField
          name="firstName"
          label="First name"
          control={form.control}
          stagger
        />
        <FormField
          name="lastName"
          label="Last name"
          control={form.control}
          stagger
        />
      </motion.div>
      <FormField
        name="dateOfBirth"
        label="Date of birth"
        control={form.control}
        inputType="date"
      />
      <Controller
        name="address"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <Label>Address</Label>
            <Textarea
              {...field}
              rows={3}
              className="resize-none bg-background/80"
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </form>
  )
}

function GovernmentIdStepForm({
  form,
  onSubmit,
}: {
  form: UseFormReturn<GovFormValues>
  onSubmit: (values: GovFormValues) => void
}) {
  return (
    <form
      id={ONBOARDING_STEPS[1].formId}
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        name="aadharNumber"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <Label>Aadhar number</Label>
            <Input
              {...field}
              inputMode="numeric"
              maxLength={12}
              className="bg-background/80 font-mono tracking-wider"
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="panNumber"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <Label>PAN number</Label>
            <Input
              {...field}
              className="bg-background/80 font-mono uppercase tracking-wider"
              maxLength={10}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </form>
  )
}

function BankDetailsStepForm({
  form,
  showAccountNumber,
  onToggleAccountVisibility,
  onSubmit,
}: {
  form: UseFormReturn<BankFormValues>
  showAccountNumber: boolean
  onToggleAccountVisibility: () => void
  onSubmit: (values: BankFormValues) => void
}) {
  return (
    <form
      id={ONBOARDING_STEPS[2].formId}
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        name="bankAccountNumber"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <Label>Account number</Label>
            <InputGroup>
              <InputGroupInput
                {...field}
                type={showAccountNumber ? 'text' : 'password'}
                autoComplete="off"
              />
              <InputGroupButton
                type="button"
                onClick={onToggleAccountVisibility}
              >
                {showAccountNumber ? <RiEyeOffLine /> : <RiEyeLine />}
              </InputGroupButton>
            </InputGroup>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <FormField
        name="confirmAccountNumber"
        label="Confirm account number"
        control={form.control}
        inputType="password"
      />
      <FormField name="bankName" label="Bank name" control={form.control} />
      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        <FormField
          name="ifscCode"
          label="IFSC code"
          control={form.control}
          className="uppercase"
          stagger
        />
        <FormField
          name="branchName"
          label="Branch name"
          control={form.control}
          stagger
        />
      </motion.div>
    </form>
  )
}

function CertificatesStepForm({
  certificates,
  onUpload,
  onRemove,
}: {
  certificates: CertificateEntry[]
  onUpload: (file: File) => void
  onRemove: (id: Id<'employeeCertificates'>) => void
}) {
  return (
    <motion.div className="space-y-4">
      <div className="rounded-xl border border-dashed border-primary/25 bg-linear-to-b from-primary/5 to-transparent p-8 text-center">
        <RiUpload2Line className="mx-auto mb-3 size-10 text-primary/70" />
        <p className="font-medium">Upload certificates</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Resume, course completion, ID copies — optional but helpful
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {['.PDF', '.JPG', '.PNG'].map((ext) => (
            <Badge key={ext} variant="secondary">
              {ext}
            </Badge>
          ))}
        </div>
        <div className="mt-5">
          <Label className="cursor-pointer">
            <Input
              type="file"
              className="sr-only"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUpload(file)
                e.target.value = ''
              }}
            />
            <span className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90">
              Choose file
            </span>
          </Label>
        </div>
      </div>

      {certificates.length > 0 ? (
        <CertificateList certificates={certificates} onRemove={onRemove} />
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Skip for now — you can add documents later.
        </p>
      )}
    </motion.div>
  )
}

function CertificateList({
  certificates,
  onRemove,
}: {
  certificates: CertificateEntry[]
  onRemove: (id: Id<'employeeCertificates'>) => void
}) {
  return (
    <ul className="space-y-2">
      {certificates.map((cert) => (
        <li
          key={cert.id}
          className="flex items-center justify-between rounded-lg border bg-card/50 px-3 py-2.5 text-sm backdrop-blur-sm"
        >
          <span className="truncate">{cert.fileName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(cert.id as Id<'employeeCertificates'>)}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  )
}

/** Reusable controlled field for simple text/date/password inputs. */
function FormField<T extends Record<string, unknown>>({
  name,
  label,
  control,
  inputType = 'text',
  className,
  stagger = false,
}: {
  name: keyof T & string
  label: string
  control: UseFormReturn<T>['control']
  inputType?: React.HTMLInputTypeAttribute
  className?: string
  stagger?: boolean
}) {
  const field = (
    <Controller
      name={name as never}
      control={control}
      render={({ field: inputField, fieldState }) => (
        <Field>
          <Label>{label}</Label>
          <Input
            {...inputField}
            type={inputType}
            value={inputField.value as string}
            className={cn('bg-background/80', className)}
            autoComplete={inputType === 'password' ? 'off' : undefined}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )

  if (!stagger) return field

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {field}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Step body — animates between steps
// ---------------------------------------------------------------------------

function OnboardingStepContent({
  stepIndex,
  error,
  wizard,
}: {
  stepIndex: number
  error: string | null
  wizard: ReturnType<typeof useInboxOnboarding>
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.2 }}
        className="mx-auto max-w-lg space-y-4"
      >
        {error ? <OnboardingErrorBanner message={error} /> : null}

        {stepIndex === 0 ? (
          <GeneralInfoStepForm
            form={wizard.generalForm}
            onSubmit={wizard.submitGeneral}
          />
        ) : null}

        {stepIndex === 1 ? (
          <GovernmentIdStepForm
            form={wizard.govForm}
            onSubmit={wizard.submitGovernmentId}
          />
        ) : null}

        {stepIndex === 2 ? (
          <BankDetailsStepForm
            form={wizard.bankForm}
            showAccountNumber={wizard.showAccountNumber}
            onToggleAccountVisibility={() =>
              wizard.setShowAccountNumber((v) => !v)
            }
            onSubmit={wizard.submitBankDetails}
          />
        ) : null}

        {stepIndex === 3 ? (
          <CertificatesStepForm
            certificates={wizard.certificates}
            onUpload={(file) => void wizard.uploadCertificate(file)}
            onRemove={(id) => void wizard.removeCertificateEntry(id)}
          />
        ) : null}
      </motion.div>
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Root panel
// ---------------------------------------------------------------------------

export function InboxOnboardingPanel(props: InboxOnboardingPanelProps) {
  const wizard = useInboxOnboarding(props)

  if (wizard.isProfileComplete) {
    return <OnboardingCompletedState />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <OnboardingHeader
        currentStep={wizard.currentStep}
        stepIndex={wizard.step}
        progress={wizard.progress}
        onGoToStep={wizard.goToStep}
      />

      <motion.div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <OnboardingStepContent
          stepIndex={wizard.step}
          error={wizard.error}
          wizard={wizard}
        />
      </motion.div>

      <OnboardingFooter
        stepIndex={wizard.step}
        submitFormId={wizard.currentStep.formId}
        onBack={() => wizard.goToStep(wizard.step - 1)}
        onFinish={() => void wizard.finishOnboarding()}
      />
    </motion.div>
  )
}
