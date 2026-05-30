import { RiCheckLine } from '@remixicon/react'

function StepDot({
  n,
  current,
  label,
}: {
  n: number
  current: number
  label: string
}) {
  const done = current > n
  const active = current === n
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors
        ${
          done
            ? 'bg-primary text-primary-foreground'
            : active
              ? 'border-2 border-primary text-primary'
              : 'border-2 border-muted text-muted-foreground'
        }`}
      >
        {done ? <RiCheckLine className="size-4" /> : n}
      </div>
      <span
        className={`text-xs ${active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
      </span>
    </div>
  )
}

const STEPS = ['Employee', 'Earnings', 'Deductions']

export function PayrollStepper({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-start">
          <StepDot n={i + 1} current={current} label={label} />
          {i < STEPS.length - 1 && <div className="mt-4 h-px w-12 bg-muted" />}
        </div>
      ))}
    </div>
  )
}
