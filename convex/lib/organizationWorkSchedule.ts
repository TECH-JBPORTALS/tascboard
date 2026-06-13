import { Infer } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { workScheduleValidator } from '../tables/organizationWorkSchedule'

export type WorkSchedule = Infer<typeof workScheduleValidator>

const defaultDay = (enabled: boolean) => ({
  enabled,
  startTime: '09:00',
  endTime: '17:00',
})

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  sunday: defaultDay(false),
  monday: defaultDay(true),
  tuesday: defaultDay(true),
  wednesday: defaultDay(true),
  thursday: defaultDay(true),
  friday: defaultDay(true),
  saturday: defaultDay(false),
}

export function validateWorkSchedule(schedule: WorkSchedule): string | null {
  for (const [weekday, day] of Object.entries(schedule)) {
    if (!day.enabled) continue
    if (day.startTime >= day.endTime) {
      return `${weekday} end time must be after start time`
    }
  }
  return null
}

function scheduleFromDoc(doc: {
  sunday: WorkSchedule['sunday']
  monday: WorkSchedule['monday']
  tuesday: WorkSchedule['tuesday']
  wednesday: WorkSchedule['wednesday']
  thursday: WorkSchedule['thursday']
  friday: WorkSchedule['friday']
  saturday: WorkSchedule['saturday']
}): WorkSchedule {
  return {
    sunday: doc.sunday,
    monday: doc.monday,
    tuesday: doc.tuesday,
    wednesday: doc.wednesday,
    thursday: doc.thursday,
    friday: doc.friday,
    saturday: doc.saturday,
  }
}

export async function getWorkSchedule(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
): Promise<WorkSchedule> {
  const doc = await ctx.db
    .query('organizationWorkSchedule')
    .withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
    .unique()

  return doc ? scheduleFromDoc(doc) : DEFAULT_WORK_SCHEDULE
}

export async function saveWorkSchedule(
  ctx: MutationCtx,
  organizationId: string,
  schedule: WorkSchedule,
) {
  const error = validateWorkSchedule(schedule)
  if (error) throw new Error(error)

  const existing = await ctx.db
    .query('organizationWorkSchedule')
    .withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
    .unique()

  if (existing) {
    await ctx.db.patch(existing._id, schedule)
    return
  }

  await ctx.db.insert('organizationWorkSchedule', {
    organizationId,
    ...schedule,
  })
}
