'use client'

import { RiCollapseDiagonalLine, RiTaskLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import { useTodoPanelStore } from '@/hooks/todo-panel-store'
import { authClient } from '@/lib/auth-client'
import { TodoAddForm } from './todo-add-form'
import { TodoList } from './todo-list'
import { TodoFab } from './todo-toggle-state'
import type { Todo } from './types'

export function TodoPanel() {
  const { isOpen, toggle, close } = useTodoPanelStore()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id

  const todos = useQuery(
    api.employeeTodos.list,
    userId ? { employeeId: userId } : 'skip',
  ) as Todo[] | undefined

  const pendingCount = todos?.filter((t) => !t.isCompleted).length ?? 0

  if (!userId) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.91, y: 14 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="w-[380px] h-[500px] flex flex-col"
          >
            <Card className="flex flex-col h-full gap-0 py-0 overflow-hidden shadow-xl">
              {/* Header */}
              <div className="flex flex-row items-center justify-between px-4 py-3 shrink-0">
                <div className="flex items-center gap-2">
                  <RiTaskLine className="size-4 text-primary" />
                  <span className="text-sm font-semibold">My Tasks</span>
                  <AnimatePresence>
                    {pendingCount > 0 && (
                      <motion.div
                        key={pendingCount}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                      >
                        <Badge variant="secondary">{pendingCount}</Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={close}
                  title="Minimize"
                >
                  <RiCollapseDiagonalLine className="size-4" />
                </Button>
              </div>
              <Separator />

              <CardContent className="flex-1 overflow-y-auto px-2 py-1 min-h-0">
                <TodoList todos={todos} />
              </CardContent>

              <TodoAddForm employeeId={userId} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <TodoFab isOpen={isOpen} pendingCount={pendingCount} onToggle={toggle} />
    </div>
  )
}
