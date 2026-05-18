"use client";

import type { PermissionRequest } from "@/lib/permissions";
import { usePermission } from "@/hooks/use-permission";

export function PermissionGate({
  permissions,
  organizationId,
  children,
  fallback = null,
}: {
  permissions: PermissionRequest;
  organizationId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { allowed, isLoading } = usePermission(permissions, organizationId);

  if (isLoading) return null;
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
