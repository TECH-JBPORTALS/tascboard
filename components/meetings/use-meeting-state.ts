'use client'

import * as React from 'react'

export type DetailTab = 'overview' | 'upcoming' | 'completed'

interface MeetingState {
  createOpen: boolean
  editId: string | null
  notesId: string | null
  attendanceId: string | null
}

interface MeetingStateActions {
  openCreate: () => void
  closeCreate: () => void
  openEdit: (id: string) => void
  closeEdit: () => void
  openNotes: (scheduleMeetingId: string) => void
  closeNotes: () => void
  openAttendance: (scheduleMeetingId: string) => void
  closeAttendance: () => void
}

export function useMeetingState(): MeetingState & MeetingStateActions {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [notesId, setNotesId] = React.useState<string | null>(null)
  const [attendanceId, setAttendanceId] = React.useState<string | null>(null)

  return {
    createOpen,
    editId,
    notesId,
    attendanceId,
    openCreate: () => setCreateOpen(true),
    closeCreate: () => setCreateOpen(false),
    openEdit: (id) => setEditId(id),
    closeEdit: () => setEditId(null),
    openNotes: (id) => setNotesId(id),
    closeNotes: () => setNotesId(null),
    openAttendance: (id) => setAttendanceId(id),
    closeAttendance: () => setAttendanceId(null),
  }
}