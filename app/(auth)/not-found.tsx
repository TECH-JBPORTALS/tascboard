import { RiTBoxLine } from '@remixicon/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function NotFound() {
  return (
    <div className="h-svh flex items-center justify-center w-full">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant={'icon'} className="size-20">
            <RiTBoxLine className="size-14 text-primary" />
          </EmptyMedia>

          <EmptyTitle className="text-4xl font-bold">404</EmptyTitle>
          <EmptyDescription className="text-foreground text-lg">
            Sorry, that page could not be found.
          </EmptyDescription>
          <EmptyDescription>
            {
              'The requested page either doesn’t exist or you don’t have access to it.'
            }
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant={'link'}
            render={<Link href={'/'} />}
            nativeButton={false}
          >
            Return Dashboard
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
