'use client'

import { RiTaskLine } from '@remixicon/react'
import { AnimatePresence } from 'motion/react'
import { Skeleton } from '@/components/ui/skeleton'
import { TodoCompleted } from './todo-completed-section'
import { TodoRow } from './todo-row'
import type { Todo } from './types'

interface Props {
  todos: Todo[] | undefined
}

export function TodoList({ todos }: Props) {
  if (todos === undefined) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    )
  }

  const pending = todos.filter((t) => !t.isCompleted)
  const completed = todos.filter((t) => t.isCompleted)

  if (pending.length === 0 && completed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1 text-center">
        <RiTaskLine className="size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground/60">
          Type below and press Enter to add one
        </p>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence mode="popLayout">
        {pending.map((todo) => (
          <TodoRow key={todo._id} todo={todo} />
        ))}
      </AnimatePresence>
      <TodoCompleted todos={completed} />
    </>
  )
}
