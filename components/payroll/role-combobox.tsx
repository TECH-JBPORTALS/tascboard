'use client'

import { RiArrowDownSLine } from '@remixicon/react'
import { useState } from 'react'
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

const ROLES = [
  'Software Engineer',
  'Senior Developer',
  'Product Manager',
  'Product Lead',
  'Data Analyst',
  'HR Specialist',
  'HR Manager',
  'Marketing Lead',
  'Designer',
  'DevOps Engineer',
  'QA Engineer',
  'Finance Manager',
  'Operations Manager',
  'Sales Executive',
  'Business Analyst',
]

type Props = { value: string; onChange: (v: string) => void }

export function RoleCombobox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = ROLES.filter((r) =>
    r.toLowerCase().includes(query.toLowerCase()),
  )

  const handleSelect = (role: string) => {
    onChange(role)
    setOpen(false)
    setQuery('')
  }

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSelect(query.trim())
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
          >
            <span className={value ? '' : 'text-muted-foreground'}>
              {value || 'Select or type a role…'}
            </span>
            <RiArrowDownSLine className="size-4 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type a role…"
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleInputKey}
          />
          <CommandList>
            {filtered.length === 0 && query.trim() ? (
              <CommandEmpty
                className="cursor-pointer py-3 text-center text-sm"
                onClick={() => handleSelect(query.trim())}
              >
                Use &ldquo;{query.trim()}&rdquo;
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((r) => (
                  <CommandItem
                    key={r}
                    value={r}
                    onSelect={() => handleSelect(r)}
                  >
                    {r}
                    {value === r && (
                      <span className="ml-auto text-primary text-xs">✓</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
