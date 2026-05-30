'use client'

import { RiMoneyDollarCircleLine } from '@remixicon/react'
import { format } from 'date-fns'

import { AddPayrollDialog } from '@/components/payroll/add-payroll-dialog'
import { exportPayrollCsv } from '@/components/payroll/payroll-export'
import { PayrollSheet } from '@/components/payroll/payroll-sheet'
import { PayrollTable } from '@/components/payroll/payroll-table'
import { PayrollToolbar } from '@/components/payroll/payroll-toolbar'
import { PayslipDialog } from '@/components/payroll/payslip-dialog'
import { usePayrollState } from '@/components/payroll/use-payroll-state'
import { PageHeader } from '@/components/ui/page-header'

export function PayrollPage() {
  const {
    activeRecord,
    addOpen,
    filtered,
    handleAdd,
    handleDelete,
    handleDownload,
    handleEdit,
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
        description="Manage employee payroll and payslips"
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
        <PayrollTable
          onDelete={handleDelete}
          onDownload={handleDownload}
          onEdit={handleEdit}
          records={filtered}
        />
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
