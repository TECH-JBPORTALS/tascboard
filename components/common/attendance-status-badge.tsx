import { RiEmojiStickerLine } from '@remixicon/react'
import { AttendanceStatus } from '@/lib/attendance-types'
import { Badge } from '../ui/badge'

export function AttendanceStatusBadge({
  status,
}: {
  status: AttendanceStatus
}) {
  switch (status) {
    case 'present':
      return (
        <Badge
          variant={'secondary'}
          className="capitalize bg-green-600/30 text-green-600"
        >
          Present
        </Badge>
      )
    case 'late':
      return (
        <Badge
          variant={'secondary'}
          className="capitalize bg-orange-600/30 text-orange-600"
        >
          Late
        </Badge>
      )

    case 'half day':
      return (
        <Badge className="capitalize bg-purple-600/30 text-purple-600">
          Half day
        </Badge>
      )

    case 'on leave':
      return (
        <Badge className="capitalize bg-green-600/30 text-green-600">
          <RiEmojiStickerLine /> Leave
        </Badge>
      )
    default:
      return null
  }
}
