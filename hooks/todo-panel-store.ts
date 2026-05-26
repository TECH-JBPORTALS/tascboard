import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TodoPanelStore {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useTodoPanelStore = create<TodoPanelStore>()(
  persist(
    (set) => ({
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'todo-panel-state', // persisted in localStorage
    },
  ),
)
