'use client'

import { useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getMonth, getYear, type PayrollRecord } from '@/lib/payroll-types'
import { toPayrollRecord } from './payroll-mapper'

const LOCAL_STORAGE_KEY = 'tascboard_local_payroll'

function loadLocalRecords(): PayrollRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PayrollRecord[]) : []
  } catch {
    return []
  }
}

function saveLocalRecords(records: PayrollRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records))
  } catch {
    // storage full or unavailable — silent fail
  }
}

export function usePayrollState() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [payslipOpen, setPayslipOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<PayrollRecord | null>(null)
  const [localRecords, setLocalRecords] = useState<PayrollRecord[]>([])

  // load from localStorage on mount
  useEffect(() => {
    setLocalRecords(loadLocalRecords())
  }, [])

  const rawRecords = useQuery(api.payroll.listAll, {})
  const employeeList = useQuery(api.employees.list, {})
  const removeMutation = useMutation(api.payroll.remove)

  const employees = useMemo(
    () =>
      (employeeList ?? []).map((e) => ({
        id: e.id,
        image: e.user?.image ?? null,
        name: e.user?.name ?? e.user?.email ?? 'Unknown',
        role: e.role,
      })),
    [employeeList],
  )

  // get IDs already in DB so we don't show duplicates
  const dbIds = useMemo(
    () => new Set((rawRecords ?? []).map((r) => r._id as string)),
    [rawRecords],
  )

  const records = useMemo(() => {
    const dbRecords = (rawRecords ?? []).map((r) =>
      toPayrollRecord(r, employees),
    )
    // only show local records that aren't already persisted in DB
    const onlyLocal = localRecords.filter((r) => !dbIds.has(r.id))
    return [...dbRecords, ...onlyLocal]
  }, [rawRecords, employees, localRecords, dbIds])

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const yearOk = getYear(r.creditedAt) === selectedYear
        const monthOk =
          selectedMonth === null || getMonth(r.creditedAt) === selectedMonth
        const searchOk =
          search.trim() === '' ||
          r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
          r.employeeId.toLowerCase().includes(search.toLowerCase())
        return yearOk && monthOk && searchOk
      }),
    [records, selectedYear, selectedMonth, search],
  )

  const handleEdit = (record: PayrollRecord) => {
    setActiveRecord(record)
    setSheetOpen(true)
  }

  const handleDownload = (record: PayrollRecord) => {
    setActiveRecord(record)
    setPayslipOpen(true)
  }

  const handleDelete = (id: string) => {
    const isLocal = localRecords.some((r) => r.id === id)
    if (isLocal) {
      const next = localRecords.filter((r) => r.id !== id)
      setLocalRecords(next)
      saveLocalRecords(next)
      return
    }
    void removeMutation({ id: id as Id<'payroll'> })
  }

  const handleAdd = (record: PayrollRecord) => {
    const next = [record, ...localRecords]
    setLocalRecords(next)
    saveLocalRecords(next)
  }

  return {
    activeRecord,
    addOpen,
    employees,
    filtered,
    handleAdd,
    handleDelete,
    handleDownload,
    handleEdit,
    isLoading: rawRecords === undefined,
    payslipOpen,
    records,
    search,
    selectedMonth,
    selectedYear,
    setAddOpen,
    setPayslipOpen,
    setSearch,
    setSelectedMonth,
    setSelectedYear,
    setSheetOpen,
    sheetOpen,
  }
}
