'use client'

import { RiCheckLine, RiCloseCircleLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import { SprintStatusIcon } from '@/components/sprints/sprint-status-picker'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  fromSprintPickerValue,
  NO_SPRINT_VALUE,
  type SprintPickerValue,
  toSprintPickerValue,
} from '@/lib/task-sprint-utils'
import { formatSprintLabel } from '@/lib/track-utils'
import { useOptionalTaskActionsContext } from '../task-actions-provider'

type TaskSprintPickerCommandProps = {
  trackId: Id<'tracks'>
  value?: SprintPickerValue
  onSelect?: (sprintId: SprintPickerValue) => void
  placeholder?: string
}

export function TaskSprintPickerCommand({
  trackId,
  value: valueProp,
  onSelect: onSelectProp,
  placeholder = 'Move to sprint…',
}: TaskSprintPickerCommandProps) {
  const context = useOptionalTaskActionsContext()
  const sprintsFromQuery = useQuery(api.sprint.listByTrack, { trackId })
  const sprints = context?.sprints ?? sprintsFromQuery ?? []
  const value = valueProp ?? context?.task.sprintId
  const onSelect =
    onSelectProp ??
    ((sprintId: SprintPickerValue) => {
      context?.setSprint(sprintId)
    })

  const selectedValue = toSprintPickerValue(value)

  return (
    <Command>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>No sprints found</CommandEmpty>
        <CommandGroup>
          <CommandItem
            value={`No sprint backlog unassigned ${NO_SPRINT_VALUE}`}
            data-checked={selectedValue === NO_SPRINT_VALUE}
            onSelect={() => onSelect(fromSprintPickerValue(NO_SPRINT_VALUE))}
          >
            <RiCloseCircleLine className="size-3.5 text-muted-foreground" />
            <span className="flex-1">No sprint</span>
            {selectedValue === NO_SPRINT_VALUE ? (
              <CommandShortcut>
                <RiCheckLine />
              </CommandShortcut>
            ) : null}
          </CommandItem>
          {sprints.map((sprint) => (
            <CommandItem
              key={sprint._id}
              value={`${formatSprintLabel(sprint.sprintNumber)} ${sprint.goal ?? ''}`}
              data-checked={selectedValue === sprint._id}
              onSelect={() => onSelect(fromSprintPickerValue(sprint._id))}
            >
              <SprintStatusIcon status={sprint.status} className="size-3.5" />
              <span className="flex-1">
                {formatSprintLabel(sprint.sprintNumber)}
              </span>
              {selectedValue === sprint._id ? (
                <CommandShortcut>
                  <RiCheckLine />
                </CommandShortcut>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
