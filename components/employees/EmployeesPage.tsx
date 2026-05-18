"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";
import { employeeColumns, type EmployeeRow } from "./employees-columns";
import { EmployeesDataTable } from "./employees-data-table";

export function EmployeesPage() {
  const { allowed, isLoading: permissionLoading } = usePermission({
    employee: ["list"],
  });
  const employees = useQuery(api.employees.auth.list, allowed ? {} : "skip");

  const rows = useMemo<EmployeeRow[]>(() => {
    if (!employees) return [];
    return employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      image: employee.image,
      role: employee.role,
      active: employee.active,
    }));
  }, [employees]);

  if (!permissionLoading && !allowed) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <p className="text-muted-foreground">
          You do not have permission to view employees.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      {employees === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : employees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No employees yet.</p>
      ) : (
        <EmployeesDataTable
          columns={employeeColumns}
          data={rows}
          getRowInactive={(row) => !row.active}
        />
      )}
    </div>
  );
}
