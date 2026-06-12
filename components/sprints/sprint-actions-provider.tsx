'use client'

import * as React from 'react'
import type { Doc } from '@/convex/_generated/dataModel'
import {
  type SprintActionsValue,
  useSprintActions,
} from '@/hooks/use-sprint-actions'

type SprintActionsContextValue = SprintActionsValue & {
  deleteDialogOpen: boolean
  setDeleteDialogOpen: (open: boolean) => void
}

const SprintActionsContext =
  React.createContext<SprintActionsContextValue | null>(null)

type SprintActionsProviderProps = {
  sprint: Doc<'sprints'>
  children: React.ReactNode
}

export function SprintActionsProvider({
  sprint,
  children,
}: SprintActionsProviderProps) {
  const actions = useSprintActions({ sprint })
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const value = React.useMemo(
    () => ({
      ...actions,
      deleteDialogOpen,
      setDeleteDialogOpen,
    }),
    [actions, deleteDialogOpen],
  )

  return (
    <SprintActionsContext.Provider value={value}>
      {children}
    </SprintActionsContext.Provider>
  )
}

export function useSprintActionsContext() {
  const context = React.useContext(SprintActionsContext)
  if (!context) {
    throw new Error(
      'useSprintActionsContext must be used within SprintActionsProvider',
    )
  }
  return context
}

export function useOptionalSprintActionsContext() {
  return React.useContext(SprintActionsContext)
}
