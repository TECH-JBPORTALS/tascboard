import type { Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

type ActiveEmployee = {
  id?: string
  _id?: string
  role?: string
}

export function getActiveEmployeeId(session: { employee: unknown }): string {
  const employee = session.employee as ActiveEmployee
  const id = employee.id ?? employee._id
  if (!id) {
    throw new Error('Active employee not found')
  }
  return id
}

export function isOrgOwner(session: { employee: unknown }): boolean {
  const employee = session.employee as ActiveEmployee
  return employee.role === 'owner'
}

export async function getMemberProjectIds(
  ctx: QueryCtx,
  employeeId: string,
): Promise<Set<Id<'projects'>>> {
  const memberships = await ctx.db
    .query('projectMember')
    .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
    .collect()

  return new Set(memberships.map((membership) => membership.projectId))
}

export async function getMemberTrackIds(
  ctx: QueryCtx,
  employeeId: string,
): Promise<Set<Id<'tracks'>>> {
  const memberships = await ctx.db
    .query('trackMember')
    .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
    .collect()

  return new Set(memberships.map((membership) => membership.trackId))
}

export async function getMemberTaskIds(
  ctx: QueryCtx,
  employeeId: string,
): Promise<Set<Id<'tasks'>>> {
  const memberships = await ctx.db
    .query('taskMember')
    .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
    .collect()

  return new Set(memberships.map((membership) => membership.taskId))
}

export async function getProjectMembers(
  ctx: QueryCtx,
  projectId: Id<'projects'>,
) {
  const projectMembers = await ctx.db
    .query('projectMember')
    .withIndex('by_project', (q) => q.eq('projectId', projectId))
    .collect()

  const members = projectMembers.map((member) => ({
    _id: member._id,
    employeeId: member.employeeId,
  }))

  const managerDoc = projectMembers.find((member) => member.manager)

  const manager = managerDoc
    ? {
        _id: managerDoc._id,
        employeeId: managerDoc.employeeId,
      }
    : null

  return {
    members,
    manager,
  }
}

export async function getTrackMembers(ctx: QueryCtx, trackId: Id<'tracks'>) {
  const members = await ctx.db
    .query('trackMember')
    .withIndex('by_track', (q) => q.eq('trackId', trackId))
    .collect()

  return {
    members: members.map((m) => ({
      _id: m._id,
      employeeId: m.employeeId,
    })),
    lead:
      members.find((m) => m.lead) != null
        ? {
            _id: members.find((m) => m.lead)!._id,
            employeeId: members.find((m) => m.lead)!.employeeId,
          }
        : null,
  }
}
