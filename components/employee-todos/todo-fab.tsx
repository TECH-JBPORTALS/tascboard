"use client";

import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { RiTaskLine, RiCloseLine } from "@remixicon/react";

interface Props {
  isOpen: boolean;
  pendingCount: number;
  onToggle: () => void;
}

export function TodoFab({ isOpen, pendingCount, onToggle }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onToggle}
      title={isOpen ? "Minimize" : "My Tasks"}
      className="relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={isOpen ? "close" : "open"}
          initial={{ rotate: -45, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 45, opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          {isOpen
            ? <RiCloseLine className="size-5" />
            : <RiTaskLine className="size-5" />}
        </motion.span>
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && pendingCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1"
          >
            <Badge className="size-4 p-0 flex items-center justify-center text-[10px]">
              {pendingCount > 9 ? "9+" : pendingCount}
            </Badge>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}