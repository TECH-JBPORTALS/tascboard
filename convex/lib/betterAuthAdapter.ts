export function getAdapterPage(result: unknown): unknown[] {
  if (
    result &&
    typeof result === "object" &&
    "page" in result &&
    Array.isArray((result as { page: unknown[] }).page)
  ) {
    return (result as { page: unknown[] }).page;
  }
  return Array.isArray(result) ? result : [];
}

export type EmployeeRecord = {
  _id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: number;
  active: boolean;
};

export type InvitationRecord = {
  _id: string;
  email: string;
  organizationId: string;
  status: string;
  expiresAt: number;
  role?: string | null;
};
