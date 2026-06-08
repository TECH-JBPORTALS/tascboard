'use client'

import {
  RiAddLine,
  RiDownloadLine,
  RiMoneyDollarCircleLine,
} from '@remixicon/react'
import { format } from 'date-fns'
import { AddPayrollDialog } from '@/components/payroll/add-payroll-dialog'
import { exportPayrollCsv } from '@/components/payroll/payroll-export'
import { PayrollSheet } from '@/components/payroll/payroll-sheet'
import { PayrollTable } from '@/components/payroll/payroll-table'
import { PayrollToolbar } from '@/components/payroll/payroll-toolbar'
import { PayslipDialog } from '@/components/payroll/payslip-dialog'
import { usePayrollState } from '@/components/payroll/use-payroll-state'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export function PayrollPage() {
  const {
    activeRecord,
    addOpen,
    filtered,
    handleAdd,
    handleDelete,
    handleDownload,
    handleEdit,
    isLoading,
    payslipOpen,
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
  } = usePayrollState()

  const exportLabel = selectedMonth
    ? format(new Date(selectedYear, selectedMonth - 1), 'MMM-yyyy')
    : String(selectedYear)

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={<RiMoneyDollarCircleLine />}
        title="Payroll"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPayrollCsv(filtered, exportLabel)}
            >
              <RiDownloadLine className="mr-1.5 size-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <RiAddLine className="mr-1.5 size-3.5" />
              Add Payroll
            </Button>
          </div>
        }
      />

      <PayrollToolbar
        onAdd={() => setAddOpen(true)}
        onExport={() => exportPayrollCsv(filtered, exportLabel)}
        onMonthChange={setSelectedMonth}
        onSearchChange={setSearch}
        onYearChange={setSelectedYear}
        search={search}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <div className="px-4 pb-6 md:px-6">
        {isLoading ? (
          <div className="flex flex-col gap-2 pt-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <PayrollTable
            onDelete={handleDelete}
            onDownload={handleDownload}
            onEdit={handleEdit}
            records={filtered}
          />
        )}
      </div>

      <PayrollSheet
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        record={activeRecord}
      />
      <PayslipDialog
        onOpenChange={setPayslipOpen}
        open={payslipOpen}
        record={activeRecord}
      />
      <AddPayrollDialog
        onAdd={handleAdd}
        onOpenChange={setAddOpen}
        open={addOpen}
      />
    </div>
  )
}
