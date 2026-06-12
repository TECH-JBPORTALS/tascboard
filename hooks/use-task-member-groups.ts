'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export function useTaskMemberGroups(taskId: string, trackId: string) {
  const taskMembers = useQuery(api.taskMember.list, {
    taskId: taskId as Id<'tasks'>,
  })
  const trackMembers = useQuery(api.trackMember.list, {
    trackId: trackId as Id<'tracks'>,
  })
  const employees = useQuery(api.employees.list)

  const taskMemberIds = new Set(
    (taskMembers ?? []).map((member) => member.employeeId),
  )

  const trackMembersGroup = (trackMembers ?? []).filter(
    (member) => !taskMemberIds.has(member.employeeId),
  )

  const trackMemberGroupIds = new Set(
    trackMembersGroup.map((member) => member.employeeId),
  )

  const organizationMembers = (employees ?? []).filter(
    (employee) =>
      !taskMemberIds.has(employee.id) && !trackMemberGroupIds.has(employee.id),
  )

  return {
    taskMembers: taskMembers ?? [],
    trackMembersGroup,
    organizationMembers,
    assignedIds: taskMemberIds,
  }
}
