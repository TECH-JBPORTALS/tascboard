'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_CARD_COUNT = 8

function MyAttendanceCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 shrink-0 rounded-sm" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  )
}

export function MyAttendanceSkeleton() {
  return (
    <div className="space-y-4 px-6 py-4">
      <Skeleton className="h-9 w-36" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
          <MyAttendanceCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export function TodayAttendanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-px" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-36" />
      </CardFooter>
    </Card>
  )
}
