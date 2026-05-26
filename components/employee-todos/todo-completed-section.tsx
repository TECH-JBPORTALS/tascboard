'use client'

import { RiArrowDownSLine } from '@remixicon/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TodoRow } from './todo-row'
import type { Todo } from './types'

export function TodoCompleted({ todos }: { todos: Todo[] }) {
  const [open, setOpen] = useState(false)

  if (todos.length === 0) return null

  return (
    <div className="mt-1">
      <Separator className="mb-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="w-full justify-start gap-1.5 h-7 px-2 text-xs font-normal text-muted-foreground"
      >
        <RiArrowDownSLine
          className={`size-3 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        {todos.length} completed
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <AnimatePresence mode="popLayout">
              {todos.map((todo) => (
                <TodoRow key={todo._id} todo={todo} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
