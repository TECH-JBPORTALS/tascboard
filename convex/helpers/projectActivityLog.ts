import { Infer } from 'convex/values'
import { format, isSameDay } from 'date-fns'
import type { MutationCtx } from '../_generated/server'
import { vv } from '../schema'

const projectActivityInputValidator = vv
  .doc('projectActivities')
  .omit('_id', '_creationTime', 'createdAt')

type ProjectActivityInput = Infer<typeof projectActivityInputValidator>

export async function logProjectActivity(
  ctx: MutationCtx,
  args: ProjectActivityInput,
) {
  const existingActivities = await ctx.db
    .query('projectActivities')
    .withIndex('by_project_actor', (q) =>
      q.eq('projectId', args.projectId).eq('actorUserId', args.actorUserId),
    )
    .collect()

  const duplicateActivity = existingActivities.find(
    (activity) =>
      activity.actorUserId === args.actorUserId &&
      activity.kind === args.kind &&
      activity.fromValue === args.fromValue &&
      activity.toValue === args.toValue &&
      activity.createdAt &&
      isSameDay(new Date(activity.createdAt), Date.now()),
  )

  if (duplicateActivity) {
    return
  }
  await ctx.db.insert('projectActivities', {
    projectId: args.projectId,
    organizationId: args.organizationId,
    actorUserId: args.actorUserId,
    actorName: args.actorName,
    kind: args.kind,
    fromValue: args.fromValue,
    toValue: args.toValue,
    createdAt: Date.now(),
  })
}

export function formatProjectDate(timestamp: number) {
  return format(new Date(timestamp), 'MMM d, yyyy')
}
