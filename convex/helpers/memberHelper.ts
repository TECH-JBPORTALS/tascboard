import type { Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

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
