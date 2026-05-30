import { Skeleton } from '@/components/ui/skeleton'
import { taskStatusOrder } from '@/lib/task-utils'

function KanbanColumnSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-72 shrink-0 flex-col self-stretch rounded-lg bg-muted/30 ring-1 ring-border/60">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <Skeleton className="size-3.5 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-4" />
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="size-6 rounded-md" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function TrackKanbanSkeleton() {
  return (
    <div className="h-full min-h-0 overflow-auto">
      <div className="flex min-h-full items-stretch gap-4 p-4">
        {taskStatusOrder.map((status) => (
          <KanbanColumnSkeleton key={status} />
        ))}
      </div>
    </div>
  )
}
