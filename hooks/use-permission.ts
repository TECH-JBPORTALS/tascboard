"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  checkRolePermission,
  type PermissionRequest,
} from "@/lib/permissions";

export function useEmployeeRole(organizationId?: string) {
  return useQuery(
    api.employees.auth.getRole,
    organizationId !== undefined ? { organizationId } : {},
  );
}

/** @deprecated Use useEmployeeRole */
export const useMemberRole = useEmployeeRole;

export function usePermission(
  permissions: PermissionRequest,
  organizationId?: string,
) {
  const role = useEmployeeRole(organizationId);

  if (role === undefined) {
    return { allowed: false, isLoading: true };
  }

  if (role === null) {
    return { allowed: false, isLoading: false };
  }

  return {
    allowed: checkRolePermission(role, permissions),
    isLoading: false,
    role,
  };
}
