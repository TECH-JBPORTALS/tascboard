'use client'

import * as React from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { getTimeOptions, normalizeTimeInput } from '@/lib/time-select'
import { cn } from '@/lib/utils'

const TIME_OPTIONS = getTimeOptions()

export type TimeSelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
}

export function TimeSelect({
  value,
  onChange,
  disabled,
  id,
  placeholder = 'Select time',
  className,
  'aria-invalid': ariaInvalid,
}: TimeSelectProps) {
  const [inputValue, setInputValue] = React.useState(value)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  function commitInput(raw: string) {
    const normalized = normalizeTimeInput(raw)
    if (!normalized) return false
    onChange(normalized)
    setInputValue(normalized)
    return true
  }

  return (
    <Combobox
      items={TIME_OPTIONS}
      value={value || null}
      onValueChange={(newValue) => {
        if (!newValue) return
        onChange(newValue)
        setInputValue(newValue)
      }}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn('w-full', className)}
        onBlur={() => {
          if (inputValue.trim() && inputValue !== value) {
            commitInput(inputValue)
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitInput(inputValue)
          }
        }}
      />
      <ComboboxContent>
        <ComboboxEmpty>No times found</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
