import { authComponent, createAuth } from './auth'
import { organizationQuery } from './lib/customFunctions'

export const listEmployees = organizationQuery({
  args: {},
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const employees = await auth.api.listMembers({
      headers,
      query: {
        filterField: 'role',
        filterOperator: 'eq',
        filterValue: 'employee',
      },
    })

    return employees.members
  },
})
