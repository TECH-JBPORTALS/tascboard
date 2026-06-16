'use client'

import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import { format, startOfMonth } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api } from '@/convex/_generated/api'
import { startOfCalendarDay } from '@/lib/calendar-date'
import { downloadCsv, payrollRowsToCsv } from '@/lib/payroll-export'
import { useQueryState, parseAsIsoDate } from 'nuqs'
import {
  createOwnerPayrollColumns,
  type OwnerPayrollRow,
} from './columns'
import { EditPayrollDialog } from './edit-dialog'
import { OwnerMonthlyPayrollShell } from './shell'
import { Skeleton } from '@/components/ui/skeleton'

function filterBySearch(rows: OwnerPayrollRow[], search: string) {
  const query = search.trim().toLowerCase()
  if (!query) return rows
  return rows.filter((row) =>
    row.employee.name.toLowerCase().includes(query),
  )
}

export function OwnerMonthlyPayroll() {
  const [selectedDate] = useQueryState(
    'date',
    parseAsIsoDate
      .withDefault(new Date())
      .withOptions({ clearOnDefault: true }),
  )
  const [search] = useQueryState('q', {
    defaultValue: '',
    clearOnDefault: true,
  })
  const [generating, setGenerating] = useState(false)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteRow, setDeleteRow] = useState<OwnerPayrollRow | null>(null)
  const [editRow, setEditRow] = useState<OwnerPayrollRow | null>(null)

  const month = startOfCalendarDay(startOfMonth(selectedDate))
  const data = useQuery(api.payroll.listByMonth, { month })
  const bulkGenerate = useMutation(api.payroll.bulkGenerate)
  const markPaid = useMutation(api.payroll.markPaid)
  const removePayroll = useMutation(api.payroll.remove)

  const filteredData = useMemo(
    () => (data ? filterBySearch(data, search) : []),
    [data, search],
  )

  async function onGenerate() {
    setGenerating(true)
    try {
      const result = await bulkGenerate({ month })
      toast.success(
        `Generated ${result.created} payslip${result.created === 1 ? '' : 's'}. Skipped ${result.skipped}.`,
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate payroll',
      )
    } finally {
      setGenerating(false)
    }
  }

  const onMarkPaid = useCallback(async (row: OwnerPayrollRow) => {
    if (!row.payroll) return
    setMarkingPaidId(row.payroll._id)
    try {
      await markPaid({ ids: [row.payroll._id] })
      toast.success(`Marked ${row.employee.name} as paid`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to mark as paid',
      )
    } finally {
      setMarkingPaidId(null)
    }
  }, [markPaid])

  const onDelete = useCallback((row: OwnerPayrollRow) => {
    setDeleteRow(row)
  }, [])

  async function confirmDelete() {
    if (!deleteRow?.payroll) return
    setDeletingId(deleteRow.payroll._id)
    try {
      await removePayroll({ id: deleteRow.payroll._id })
      toast.success(`Deleted payslip for ${deleteRow.employee.name}`)
      if (editRow?.payroll?._id === deleteRow.payroll._id) {
        setEditRow(null)
      }
      setDeleteRow(null)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete payslip',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function onExport() {
    if (!data) return
    const exportRows = data
      .filter((row) => row.payroll)
      .map((row) => ({
        employeeName: row.employee.name,
        employeeEmail: row.employee.email,
        payPeriodStart: row.payroll!.payPeriodStart,
        payPeriodEnd: row.payroll!.payPeriodEnd,
        basicSalary: row.payroll!.basicSalary,
        deduction: row.payroll!.deduction,
        overtimePay: row.payroll!.overtimePay,
        bonus: row.payroll!.bonus,
        netSalary: row.payroll!.netSalary,
        creditedAt: row.payroll!.creditedAt,
      }))

    const csv = payrollRowsToCsv(exportRows)
    downloadCsv(`payroll-${format(selectedDate, 'yyyy-MM')}.csv`, csv)
  }

  const columns = createOwnerPayrollColumns({
    onEdit: setEditRow,
    onMarkPaid,
    onDelete,
    markingPaidId,
    deletingId,
  })

  const editInitialValues = editRow
    ? {
        basicSalary:
          editRow.payroll?.basicSalary ??
          editRow.monthlyBasicSalary ??
          0,
        deduction: editRow.payroll?.deduction ?? 0,
        overtimePay: editRow.payroll?.overtimePay ?? 0,
        bonus: editRow.payroll?.bonus ?? 0,
        notes: editRow.payroll?.notes,
      }
    : null

  return (
    <>
      <OwnerMonthlyPayrollShell
        onGenerate={onGenerate}
        onExport={onExport}
        generating={generating}
      >
        {data === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </OwnerMonthlyPayrollShell>

      {editRow && editInitialValues ? (
        <EditPayrollDialog
          open={editRow !== null}
          onOpenChange={(open) => {
            if (!open) setEditRow(null)
          }}
          employeeId={editRow.employee.id}
          employeeName={editRow.employee.name}
          month={selectedDate}
          initialValues={editInitialValues}
        />
      ) : null}

      <AlertDialog
        open={deleteRow !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteRow(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payslip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the payslip for{' '}
              {deleteRow?.employee.name} for{' '}
              {format(selectedDate, 'MMMM yyyy')}. The employee will no longer
              see it. You can create a new payslip later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletingId !== null}
              onClick={() => void confirmDelete()}
            >
              {deletingId !== null ? 'Deleting...' : 'Delete payslip'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
