'use client'
import { RiErrorWarningLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-svh">
      <Empty>
        <EmptyMedia variant="icon" className="size-12 bg-destructive/10 ">
          <RiErrorWarningLine className="size-8 text-destructive" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{error.message ?? 'Something went wrong!'}</EmptyTitle>
          <EmptyDescription>
            This invitation your looking for doesn't exist or has been removed.
            May be we are facing some technical issues. Please try again later.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
