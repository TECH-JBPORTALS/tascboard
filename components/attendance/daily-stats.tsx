import type { EnrichedAttendance } from '@/lib/attendance-types'

type Props = {
  records: EnrichedAttendance[]
  totalEmployees: number
}

type StatCardProps = {
  label: string
  value: number
  sub?: string
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className='flex flex-col gap-1 rounded-lg border bg-card p-4'>
      <span className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
        {label}
      </span>
      <span className='text-2xl font-bold'>{value}</span>
      {sub ? (
        <span className='text-xs text-muted-foreground'>{sub}</span>
      ) : null}
    </div>
  )
}

export function DailyStats({ records, totalEmployees }: Props) {
  const present = records.filter((r) => r.status === 'present').length
  const late = records.filter((r) => r.status === 'late').length
  const onLeave = records.filter((r) => r.status === 'on leave').length
  const halfDay = records.filter((r) => r.status === 'half day').length
  const absent = Math.max(0, totalEmployees - records.length)

  return (
    <div className='grid grid-cols-2 gap-3 p-4 md:grid-cols-5 md:p-6'>
      <StatCard label='Present' value={present} />
      <StatCard label='Late' value={late} />
      <StatCard label='Half Day' value={halfDay} />
      <StatCard label='On Leave' value={onLeave} />
      <StatCard
        label='Absent'
        value={absent}
        sub={`of ${totalEmployees} total`}
      />
    </div>
  )
}