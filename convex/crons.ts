import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'generate meeting schedules',
  { hours: 24 },
  internal.meetingScheduler.generateRecurringSchedules,
  {},
)

export default crons
