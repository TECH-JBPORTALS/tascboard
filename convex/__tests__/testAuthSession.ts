export let mockEmployee: { id: string; role: string } = {
  id: 'emp-1',
  role: 'owner',
}

export function buildMockSession() {
  return {
    userId: 'user-1',
    activeOrganizationId: 'org-1',
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    employee: mockEmployee,
  }
}

export function setMockEmployee(employee: { id: string; role: string }) {
  mockEmployee = employee
}

export function resetMockEmployee() {
  mockEmployee = { id: 'emp-1', role: 'owner' }
}
