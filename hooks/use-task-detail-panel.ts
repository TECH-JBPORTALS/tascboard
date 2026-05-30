'use client'

import * as React from 'react'

const STORAGE_KEY = 'tascboard:task-detail-panel-open'
const DEFAULT_OPEN = false

export function useTaskDetailPanel() {
  const [open, setOpenState] = React.useState(DEFAULT_OPEN)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') {
        setOpenState(true)
      } else if (stored === 'false') {
        setOpenState(false)
      }
    } catch {
      // Ignore storage errors (private mode, etc.)
    }
    setHydrated(true)
  }, [])

  const setOpen = React.useCallback((value: boolean) => {
    setOpenState(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      // Ignore storage errors
    }
  }, [])

  const toggle = React.useCallback(() => {
    setOpenState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }, [])

  return { open, setOpen, toggle, hydrated }
}
