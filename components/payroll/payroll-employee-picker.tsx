'use client'
import { RiAccountCircle2Line } from '@remixicon/react'
import { useState } from 'react'

import { UserAvatar } from '@/components/employees/user-avatar'
import { Button } from '@/components/ui/button'
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

export type EmployeeOption = {
  id: string
  name: string
  role: string
  image: string | null
}

interface PayrollEmployeePickerProps {
  employees: EmployeeOption[]
  onChange: (employee: EmployeeOption) => void
  value: string
}

export function PayrollEmployeePicker({
  employees,
  onChange,
  value,
}: PayrollEmployeePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = employees.find((e) => e.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            {selected ? (
              <div className="flex items-center gap-2">
                <UserAvatar
                  name={selected.name}
                  imageUrl={selected.image}
                  className="size-5"
                />
                <span>{selected.name}</span>
              </div>
            ) : (
              <>
                <RiAccountCircle2Line />
                Select Employee
              </>
            )}
          </Button>
        }
      />
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search employee..." />
            <CommandEmpty>No employees found.</CommandEmpty>
            <CommandGroup>
              {employees.map((e) => (
                <CommandItem
                  key={e.id}
                  value={e.id}
                  onSelect={() => {
                    onChange(e)
                    setOpen(false)
                  }}
                >
                  <UserAvatar
                    name={e.name}
                    imageUrl={e.image}
                    className="size-5"
                  />
                  <div>
                    <p className="text-sm">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.role}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
