'use client'

import * as React from 'react'
import type { Doc } from '@/convex/_generated/dataModel'
import { type TaskActionsValue, useTaskActions } from '@/hooks/use-task-actions'

type TaskActionsContextValue = TaskActionsValue & {
  deleteDialogOpen: boolean
  setDeleteDialogOpen: (open: boolean) => void
  customDueDateOpen: boolean
  setCustomDueDateOpen: (open: boolean) => void
}

const TaskActionsContext = React.createContext<TaskActionsContextValue | null>(
  null,
)

type TaskActionsProviderProps = {
  task: Doc<'tasks'>
  children: React.ReactNode
}

export function TaskActionsProvider({
  task,
  children,
}: TaskActionsProviderProps) {
  const actions = useTaskActions({ task })
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [customDueDateOpen, setCustomDueDateOpen] = React.useState(false)

  const value = React.useMemo(
    () => ({
      ...actions,
      deleteDialogOpen,
      setDeleteDialogOpen,
      customDueDateOpen,
      setCustomDueDateOpen,
    }),
    [actions, customDueDateOpen, deleteDialogOpen],
  )

  return (
    <TaskActionsContext.Provider value={value}>
      {children}
    </TaskActionsContext.Provider>
  )
}

export function useTaskActionsContext() {
  const context = React.useContext(TaskActionsContext)
  if (!context) {
    throw new Error(
      'useTaskActionsContext must be used within TaskActionsProvider',
    )
  }
  return context
}

export function useOptionalTaskActionsContext() {
  return React.useContext(TaskActionsContext)
}
