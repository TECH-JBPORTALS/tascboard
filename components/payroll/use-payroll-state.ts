'use client'

import { useState } from 'react'
import { MOCK_PAYROLL } from '@/components/payroll/mock-data'
import { getMonth, getYear, type PayrollRecord } from '@/lib/payroll-types'

export function usePayrollState() {
  const [records, setRecords] = useState<PayrollRecord[]>(MOCK_PAYROLL)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [payslipOpen, setPayslipOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<PayrollRecord | null>(null)

  const filtered = records.filter((r) => {
    const yearOk = getYear(r.creditedAt) === selectedYear
    const monthOk =
      selectedMonth === null || getMonth(r.creditedAt) === selectedMonth
    const searchOk =
      search.trim() === '' ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(search.toLowerCase())
    return yearOk && monthOk && searchOk
  })

  const handleEdit = (record: PayrollRecord) => {
    setActiveRecord(record)
    setSheetOpen(true)
  }

  const handleDownload = (record: PayrollRecord) => {
    setActiveRecord(record)
    setPayslipOpen(true)
  }

  const handleDelete = (id: string) =>
    setRecords((prev) => prev.filter((r) => r.id !== id))

  const handleAdd = (record: PayrollRecord) =>
    setRecords((prev) => [record, ...prev])

  return {
    records,
    filtered,
    selectedYear,
    selectedMonth,
    search,
    addOpen,
    sheetOpen,
    payslipOpen,
    activeRecord,
    setSelectedYear,
    setSelectedMonth,
    setSearch,
    setAddOpen,
    setSheetOpen,
    setPayslipOpen,
    handleEdit,
    handleDownload,
    handleDelete,
    handleAdd,
  }
}
