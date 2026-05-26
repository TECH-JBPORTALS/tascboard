export function buildGroups(input: {
  organization: string[]
  project: string[]
  track: string[]
  task: string[]
}) {
  const taskSet = new Set(input.task)
  const trackSet = new Set(input.track)
  const projectSet = new Set(input.project)

  const task: string[] = []
  const track: string[] = []
  const project: string[] = []
  const organization: string[] = []

  const all = new Set([
    ...input.organization,
    ...input.project,
    ...input.track,
    ...input.task,
  ])

  for (const userId of all) {
    if (taskSet.has(userId)) {
      task.push(userId)
    } else if (trackSet.has(userId)) {
      track.push(userId)
    } else if (projectSet.has(userId)) {
      project.push(userId)
    } else {
      organization.push(userId)
    }
  }

  return {
    task,
    track,
    project,
    organization,
  }
}
