'use client'

import {
  RiArrowRightSFill,
  RiCalendarLine,
  RiCloseLine,
  RiFilter3Line,
  RiLoader2Line,
  RiPriceTag3Line,
  RiRunLine,
  RiUserLine,
} from '@remixicon/react'
import { useQuery } from 'convex/react'
import { endOfDay, format, startOfDay } from 'date-fns'
import * as React from 'react'
import { useTrackTaskFiltersContext } from '@/components/tracks/track-task-filters-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  type TaskStatus,
  taskStatusConfig,
  taskStatusOrder,
} from '@/lib/task-utils'
import {
  type DueDatePreset,
  dueDatePresetLabels,
  dueDatePresetOrder,
  type TrackTaskFilterType,
} from '@/lib/track-task-filters'
import { cn } from '@/lib/utils'

const filterTypeLabels: Record<TrackTaskFilterType, string> = {
  assignee: 'Assignee',
  due: 'Due date',
  label: 'Label',
  sprint: 'Sprint',
  status: 'Status',
}

export function TrackTaskFilterBar({
  trackId,
  projectId,
}: {
  trackId: Id<'tracks'>
  projectId: Id<'projects'>
}) {
  const filters = useTrackTaskFiltersContext()
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<'type' | TrackTaskFilterType>('type')

  const employees = useQuery(api.task.listTaskEmployees, { trackId })
  const labels = useQuery(api.label.listByProject, { projectId })
  const sprints = useQuery(api.sprint.listByTrack, { trackId })

  const [customFrom, setCustomFrom] = React.useState<Date | undefined>()
  const [customTo, setCustomTo] = React.useState<Date | undefined>()

  const resetPopover = React.useCallback(() => {
    setStep('type')
    setCustomFrom(undefined)
    setCustomTo(undefined)
  }, [])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) resetPopover()
    },
    [resetPopover],
  )

  const selectFilterType = (type: TrackTaskFilterType) => {
    setStep(type)
  }

  const applyCustomDueRange = () => {
    filters.setDueRange(
      customFrom ? startOfDay(customFrom).getTime() : null,
      customTo ? endOfDay(customTo).getTime() : null,
    )
    handleOpenChange(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="h-7">
              <RiFilter3Line className="size-3.5" />
              Filter
            </Button>
          }
        />
        <PopoverContent className="w-64 p-0" align="start" sideOffset={4}>
          {step === 'type' ? (
            <Command>
              <CommandInput placeholder="Filter by…" className="h-8" />
              <CommandList>
                <CommandEmpty>No filters</CommandEmpty>
                <CommandGroup>
                  {filters.availableFilterTypes.map((type) => (
                    <CommandItem
                      key={type}
                      value={filterTypeLabels[type]}
                      onSelect={() => selectFilterType(type)}
                    >
                      {filterTypeIcon(type)}
                      {filterTypeLabels[type]}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          ) : step === 'assignee' ? (
            <AssigneeFilterPicker
              employees={employees ?? []}
              selected={filters.urlState.assigneeIds}
              onSelect={(id) => {
                filters.addAssignee(id)
                handleOpenChange(false)
              }}
              onBack={() => setStep('type')}
            />
          ) : step === 'label' ? (
            <LabelFilterPicker
              labels={labels ?? []}
              selected={filters.urlState.labelIds}
              onSelect={(id) => {
                filters.addLabel(id)
                handleOpenChange(false)
              }}
              onBack={() => setStep('type')}
            />
          ) : step === 'sprint' ? (
            <SprintFilterPicker
              sprints={sprints ?? []}
              onSelect={(id) => {
                filters.setSprint(id)
                handleOpenChange(false)
              }}
              onBack={() => setStep('type')}
            />
          ) : step === 'status' ? (
            <StatusFilterPicker
              selected={filters.urlState.statuses}
              onSelect={(status) => {
                filters.addStatus(status)
                handleOpenChange(false)
              }}
              onBack={() => setStep('type')}
            />
          ) : (
            <DueDateFilterPicker
              hasDueFilter={filters.urlState.duePreset !== null}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              onPresetSelect={(preset) => {
                if (preset === 'custom') {
                  filters.setDuePreset('custom')
                  return
                }
                filters.setDuePreset(preset)
                handleOpenChange(false)
              }}
              onApplyCustom={applyCustomDueRange}
              onBack={() => setStep('type')}
            />
          )}
        </PopoverContent>
      </Popover>

      {filters.activeFilters.map((filter) => (
        <Badge key={filter.id} variant="outline" className="gap-1 pr-1">
          <span className="text-muted-foreground">
            {filterTypeLabels[filter.type]}:
          </span>
          {filter.label}
          <button
            type="button"
            className="rounded-full p-0.5 hover:bg-muted"
            aria-label={`Remove ${filter.label} filter`}
            onClick={() => filters.removeFilter(filter)}
          >
            <RiCloseLine className="size-3" />
          </button>
        </Badge>
      ))}

      {filters.hasActiveFilters ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => filters.clearAll()}
        >
          Clear all
        </Button>
      ) : null}
    </div>
  )
}

function filterTypeIcon(type: TrackTaskFilterType) {
  const className = 'size-3.5 shrink-0 text-muted-foreground'
  switch (type) {
    case 'assignee':
      return <RiUserLine className={className} />
    case 'due':
      return <RiCalendarLine className={className} />
    case 'sprint':
      return <RiRunLine className={className} />
    case 'label':
      return <RiPriceTag3Line className={className} />
    case 'status':
      return <RiLoader2Line className={className} />

    default:
      return null
  }
}

type AssigneeOption = (typeof api.task.listTaskEmployees._returnType)[number]

function AssigneeFilterPicker({
  employees,
  selected,
  onSelect,
  onBack,
}: {
  employees: AssigneeOption[]
  selected: string[]
  onSelect: (id: string) => void
  onBack: () => void
}) {
  const options = employees
    .filter((e) => !selected.includes(e.employeeId))
    .map((e) => ({
      value: e.employeeId,
      label: e.employee.name || e.employeeId,
      icon: (
        <Avatar className="size-5">
          {e.employee.image ? (
            <AvatarImage src={e.employee.image} alt="" />
          ) : null}
          <AvatarFallback className="text-[10px]">
            {(e.employee.name || '?').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
    }))

  return (
    <FilterPickerShell title="Assignee" onBack={onBack}>
      <Command>
        <CommandInput placeholder="Search assignees…" className="h-8" />
        <CommandList>
          <CommandEmpty>No assignees on this track</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => onSelect(option.value)}
              >
                {option.icon}
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </FilterPickerShell>
  )
}

function LabelFilterPicker({
  labels,
  selected,
  onSelect,
  onBack,
}: {
  labels: (typeof api.label.listByProject._returnType)[number][]
  selected: Id<'labels'>[]
  onSelect: (id: Id<'labels'>) => void
  onBack: () => void
}) {
  return (
    <FilterPickerShell title="Label" onBack={onBack}>
      <Command>
        <CommandInput placeholder="Search labels…" className="h-8" />
        <CommandList>
          <CommandEmpty>No labels</CommandEmpty>
          <CommandGroup>
            {labels
              .filter((l) => !selected.includes(l._id))
              .map((label) => (
                <CommandItem
                  key={label._id}
                  value={label.name}
                  onSelect={() => onSelect(label._id)}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </FilterPickerShell>
  )
}

function SprintFilterPicker({
  sprints,
  onSelect,
  onBack,
}: {
  sprints: (typeof api.sprint.listByTrack._returnType)[number][]
  onSelect: (id: Id<'sprints'>) => void
  onBack: () => void
}) {
  return (
    <FilterPickerShell title="Sprint" onBack={onBack}>
      <Command>
        <CommandInput placeholder="Search sprints…" className="h-8" />
        <CommandList>
          <CommandEmpty>No sprints</CommandEmpty>
          <CommandGroup>
            {sprints.map((sprint) => (
              <CommandItem
                key={sprint._id}
                value={`Sprint ${sprint.sprintNumber}`}
                onSelect={() => onSelect(sprint._id)}
              >
                <RiRunLine className="size-3.5 text-muted-foreground" />
                {`Sprint ${sprint.sprintNumber}`}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </FilterPickerShell>
  )
}

function StatusFilterPicker({
  selected,
  onSelect,
  onBack,
}: {
  selected: TaskStatus[]
  onSelect: (status: TaskStatus) => void
  onBack: () => void
}) {
  const options = taskStatusOrder
    .filter((s) => !selected.includes(s))
    .map((status) => {
      const config = taskStatusConfig[status]
      const Icon = config.icon
      return {
        value: status,
        label: config.label,
        icon: <Icon className={cn('size-3.5', config.iconClassName)} />,
      }
    })

  return (
    <FilterPickerShell title="Status" onBack={onBack}>
      <Command>
        <CommandInput placeholder="Search status…" className="h-8" />
        <CommandList>
          <CommandEmpty>No statuses</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => onSelect(option.value)}
              >
                {option.icon}
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </FilterPickerShell>
  )
}

function DueDateFilterPicker({
  hasDueFilter,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onPresetSelect,
  onApplyCustom,
  onBack,
}: {
  hasDueFilter: boolean
  customFrom: Date | undefined
  customTo: Date | undefined
  onCustomFromChange: (d: Date | undefined) => void
  onCustomToChange: (d: Date | undefined) => void
  onPresetSelect: (preset: DueDatePreset) => void
  onApplyCustom: () => void
  onBack: () => void
}) {
  const [showCustom, setShowCustom] = React.useState(false)

  if (showCustom) {
    return (
      <FilterPickerShell
        title="Custom range"
        onBack={() => setShowCustom(false)}
      >
        <div className="flex flex-col gap-3 p-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">From</p>
            <Calendar
              mode="single"
              selected={customFrom}
              onSelect={onCustomFromChange}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">To</p>
            <Calendar
              mode="single"
              selected={customTo}
              onSelect={onCustomToChange}
              disabled={
                customFrom ? (date) => date < startOfDay(customFrom) : undefined
              }
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!customFrom && !customTo}
            onClick={onApplyCustom}
          >
            Apply
            {customFrom || customTo
              ? ` (${[
                  customFrom ? format(customFrom, 'MMM d') : null,
                  customTo ? format(customTo, 'MMM d') : null,
                ]
                  .filter(Boolean)
                  .join(' – ')})`
              : null}
          </Button>
        </div>
      </FilterPickerShell>
    )
  }

  return (
    <FilterPickerShell title="Due date" onBack={onBack}>
      <Command>
        <CommandList>
          <CommandGroup>
            {dueDatePresetOrder.map((preset) => (
              <CommandItem
                key={preset}
                value={dueDatePresetLabels[preset]}
                onSelect={() => {
                  if (preset === 'custom') {
                    setShowCustom(true)
                    onPresetSelect('custom')
                    return
                  }
                  onPresetSelect(preset)
                }}
              >
                {dueDatePresetLabels[preset]}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      {hasDueFilter ? (
        <p className="px-2 pb-2 text-[10px] text-muted-foreground">
          Adding a new due filter replaces the current one.
        </p>
      ) : null}
    </FilterPickerShell>
  )
}

function FilterPickerShell({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-xs"
          onClick={onBack}
        >
          Back
        </Button>
        <div className="flex gap-2.5 items-center">
          <RiArrowRightSFill className="text-muted-foreground size-3.5" />
          <span className="text-xs font-medium">{title}</span>
        </div>
      </div>
      {children}
    </div>
  )
}
