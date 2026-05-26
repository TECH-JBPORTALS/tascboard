import { formatDistanceToNow } from 'date-fns'
import type { Doc } from '@/convex/_generated/dataModel'

type Activity = Doc<'activities'>

export function formatActivityTime(activity: Activity) {
  const ts = activity.createdAt ?? activity._creationTime
  return formatDistanceToNow(ts, { addSuffix: true })
}

export function formatActivityMessage(activity: Activity) {
  const actor = activity.deviceName

  switch (activity.kind) {
    case 'created':
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> created
          the task
        </>
      )
    case 'title_changed':
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> renamed
          from{' '}
          <span className="text-muted-foreground">{activity.fromValue}</span> to{' '}
          <span className="text-foreground">{activity.toValue}</span>
        </>
      )
    case 'status_changed':
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> moved
          from {activity.fromValue} to {activity.toValue}
        </>
      )
    case 'priority_changed':
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> set
          priority to {activity.toValue}
        </>
      )
    case 'due_date_changed':
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> changed
          the due date from {activity.fromValue} to {activity.toValue}
        </>
      )
    case 'label_added':
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> added
          label <span className="text-foreground">• {activity.toValue}</span>
        </>
      )
    case 'label_removed':
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> removed
          label{' '}
          <span className="text-muted-foreground">• {activity.fromValue}</span>
        </>
      )
    default:
      return (
        <>
          <span className="font-medium text-foreground">{actor}</span> updated
          the task
        </>
      )
  }
}
