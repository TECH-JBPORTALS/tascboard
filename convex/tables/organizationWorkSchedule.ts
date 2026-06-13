import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const dayWorkSchedule = v.object({
  enabled: v.boolean(),
  startTime: v.string(),
  endTime: v.string(),
})

export const workScheduleValidator = v.object({
  sunday: dayWorkSchedule,
  monday: dayWorkSchedule,
  tuesday: dayWorkSchedule,
  wednesday: dayWorkSchedule,
  thursday: dayWorkSchedule,
  friday: dayWorkSchedule,
  saturday: dayWorkSchedule,
})

export const organizationWorkSchedule = defineTable({
  organizationId: v.string(),
  sunday: dayWorkSchedule,
  monday: dayWorkSchedule,
  tuesday: dayWorkSchedule,
  wednesday: dayWorkSchedule,
  thursday: dayWorkSchedule,
  friday: dayWorkSchedule,
  saturday: dayWorkSchedule,
}).index('by_organization', ['organizationId'])
