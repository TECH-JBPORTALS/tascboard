import { internalMutation } from './_generated/server'
import { generateSchedulesForMeeting } from './lib/meetingScheduler'

const DAYS_AHEAD = 14

export const generateRecurringSchedules = internalMutation({
  args: {},
  handler: async (ctx) => {
    const meetings = await ctx.db.query('meeting').collect()
    let totalCreated = 0

    for (const meeting of meetings) {
      if (meeting.recurrenceType === 'none') continue
      totalCreated += await generateSchedulesForMeeting(
        ctx,
        meeting,
        DAYS_AHEAD,
      )
    }

    return { totalCreated }
  },
})
