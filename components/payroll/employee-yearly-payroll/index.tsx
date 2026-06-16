'use client'

import { RiCalendar2Line } from '@remixicon/react'
import { useQuery } from 'convex-helpers/react/cache'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { formatCurrency } from '@/lib/payroll-types'
import { PayslipDetail, printPayslipPdf } from '../payslip-detail'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear - index)

export function EmployeeYearlyPayroll() {
  const [year, setYear] = useState(currentYear)
  const [selectedId, setSelectedId] = useState<Id<'payroll'> | null>(null)

  const summary = useQuery(api.payroll.getYearSummary, { year })
  const payslips = useQuery(api.payroll.listMineByYear, { year })
  const selectedPayslip = useQuery(
    api.payroll.get,
    selectedId ? { id: selectedId } : 'skip',
  )

  const sortedPayslips = useMemo(() => payslips ?? [], [payslips])

  return (
    <div className="space-y-4 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <Popover>
          <PopoverTrigger
            render={
              <Button size="lg" variant="outline">
                <RiCalendar2Line className="text-muted-foreground" />
                {year}
              </Button>
            }
          />
          <PopoverContent className="w-fit p-2">
            <div className="grid gap-1">
              {yearOptions.map((option) => (
                <Button
                  key={option}
                  variant={option === year ? 'secondary' : 'ghost'}
                  className="justify-start"
                  onClick={() => setYear(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {summary === undefined ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>Year-to-date net</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(summary.totalNetSalary)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>Total earnings</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(
                  summary.totalBasicSalary +
                    summary.totalOvertimePay +
                    summary.totalBonus,
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardDescription>Paid months</CardDescription>
              <CardTitle className="text-2xl">{summary.paidMonths}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {payslips === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : sortedPayslips.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No paid payslips for {year}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedPayslips.map((payslip) => (
            <Card
              key={payslip._id}
              className="cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => setSelectedId(payslip._id)}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {format(new Date(payslip.payPeriodStart), 'MMMM yyyy')}
                </CardTitle>
                <Badge variant="secondary">Paid</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Net salary</span>
                  <span className="font-semibold">
                    {formatCurrency(payslip.netSalary)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paid on</span>
                  <span>
                    {format(new Date(payslip.creditedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={selectedId !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedId(null)
        }}
      >
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Payslip details</SheetTitle>
            <SheetDescription>
              Review your salary breakdown for the selected month.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {selectedPayslip === undefined ? (
              <Skeleton className="h-64 w-full" />
            ) : selectedPayslip ? (
              <PayslipDetail
                payslip={selectedPayslip}
                showDownload
                onDownload={printPayslipPdf}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
