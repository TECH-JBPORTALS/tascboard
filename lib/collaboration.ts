const CURSOR_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#16a34a',
  '#0891b2',
  '#ca8a04',
  '#dc2626',
]

export function getCollaborationCursorColor(seed: string) {
  let hash = 0

  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]!
}

export function getCollaborationUser(
  displayName: string | null | undefined,
  userId: string,
) {
  const name = displayName?.trim() || 'Anonymous'

  return {
    name,
    color: getCollaborationCursorColor(userId),
  }
}
