import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { ProjectActivityValidator } from '../schema'

function getStartOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.getTime()
}
export async function logProjectActivity(
  ctx: MutationCtx,
  args: Omit<typeof ProjectActivityValidator.type, 'createdAt'>,
) {
  const startOfToday = getStartOfToday()

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
      (activity.createdAt ?? 0) >= startOfToday,
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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export function actorDisplayName(identity: {
  name?: string | null
  email?: string | null
}) {
  const name = identity.name?.trim()
  if (name) {
    return name
  }
  const email = identity.email?.trim()
  if (email) {
    return email
  }
  return 'Someone'
}
