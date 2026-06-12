'use client'

import { useMutation } from 'convex/react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Protect } from '@/components/auth/protect'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import { Card, CardContent } from '../ui/card'
import { Spinner } from '../ui/spinner'

type EmployeeDangerZoneSectionProps = {
  employeeId: string
  employeeName: string
  active: boolean
}

export function EmployeeDangerZoneSection({
  employeeId,
  employeeName,
  active,
}: EmployeeDangerZoneSectionProps) {
  const router = useRouter()
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const removeEmployee = useMutation(api.employees.removeEmployee)
  const setEmployeeActive = useMutation(api.employees.setEmployeeActive)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeOpen, setActiveOpen] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await removeEmployee({ employeeId })
      toast.success('Employee removed')
      router.replace(`/${orgSlug}/employees`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove employee',
      )
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
    }
  }

  async function handleToggleActive() {
    setIsTogglingActive(true)
    try {
      await setEmployeeActive({ employeeId, active: !active })
      toast.success(active ? 'Employee deactivated' : 'Employee activated')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update employee status',
      )
    } finally {
      setIsTogglingActive(false)
      setActiveOpen(false)
    }
  }

  return (
    <Protect permissions={{ organization: ['delete'] }}>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium text-destructive">Danger zone</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Irreversible or sensitive actions for this employee.
          </p>
        </div>

        <Card className="py-0 gap-0">
          <CardContent className="py-4">
            <FieldSet className="grid grid-cols-6">
              <div className="col-span-4">
                <FieldLegend>
                  {active ? 'Deactivate employee' : 'Activate employee'}
                </FieldLegend>
                <FieldDescription>
                  {active
                    ? `Deactivate "${employeeName}" so they can no longer access this organization.`
                    : `Reactivate "${employeeName}" so they can access this organization again.`}
                </FieldDescription>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <AlertDialog open={activeOpen} onOpenChange={setActiveOpen}>
                  <AlertDialogTrigger
                    render={
                      <Button variant="outline" size="sm">
                        {active ? 'Deactivate' : 'Activate'}
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {active ? 'Deactivate employee?' : 'Activate employee?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {active
                          ? `"${employeeName}" will lose access to this organization until reactivated.`
                          : `"${employeeName}" will regain access to this organization.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isTogglingActive}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isTogglingActive}
                        onClick={() => void handleToggleActive()}
                      >
                        {isTogglingActive ? (
                          <Spinner className="size-4" />
                        ) : null}
                        {active ? 'Deactivate' : 'Activate'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </FieldSet>
          </CardContent>

          <Separator />

          <CardContent className="py-4">
            <FieldSet className="grid grid-cols-6">
              <div className="col-span-4">
                <FieldLegend>Delete employee</FieldLegend>
                <FieldDescription>
                  Permanently remove &quot;{employeeName}&quot; from this
                  organization. Their profile data for this org will be deleted.
                  This cannot be undone.
                </FieldDescription>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger
                    render={
                      <Button variant="destructive" size="sm">
                        Delete employee
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove &quot;{employeeName}&quot;
                        from the organization and delete their org profile data.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={() => void handleDelete()}
                      >
                        {isDeleting ? <Spinner className="size-4" /> : null}
                        Delete employee
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </FieldSet>
          </CardContent>
        </Card>
      </div>
    </Protect>
  )
}
