import { startOfDay } from 'date-fns'
import type { Doc } from '@/convex/_generated/dataModel'

export type InboxItem = Doc<'inboxItems'>

export type InboxGroupLabel = 'Today' | 'Yesterday' | 'Earlier'

export function groupLabelForTimestamp(ts: number): InboxGroupLabel {
  const d = new Date(ts)
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d >= today) {
    return 'Today'
  }
  if (d >= yesterday) {
    return 'Yesterday'
  }
  return 'Earlier'
}

export function matchesInboxSearch(item: InboxItem, query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return true
  }
  const haystack = [item.title, item.snippet, item.body, item.actorName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(trimmed)
}

export function filterInboxItems(
  items: InboxItem[],
  query: string,
): InboxItem[] {
  return items.filter((item) => matchesInboxSearch(item, query))
}

export function groupInboxItems(items: InboxItem[]) {
  const order: InboxGroupLabel[] = ['Today', 'Yesterday', 'Earlier']
  const map = new Map<InboxGroupLabel, InboxItem[]>()
  for (const label of order) {
    map.set(label, [])
  }
  for (const item of items) {
    const label = groupLabelForTimestamp(item._creationTime)
    map.get(label)!.push(item)
  }
  return order
    .map((label) => ({ label, items: map.get(label)! }))
    .filter((g) => g.items.length > 0)
}

/** Flat list in sidebar display order (newest first within each group). */
export function flattenInboxGroups(
  groups: Array<{ label: InboxGroupLabel; items: InboxItem[] }>,
): InboxItem[] {
  return groups.flatMap((group) => group.items)
}

export function getAdjacentInboxItemId(
  items: InboxItem[],
  currentId: string | undefined,
  direction: 'next' | 'previous',
): string | undefined {
  if (items.length === 0) {
    return undefined
  }
  if (!currentId) {
    return items[0]?._id
  }
  const index = items.findIndex((item) => item._id === currentId)
  if (index === -1) {
    return items[0]?._id
  }
  const offset = direction === 'next' ? 1 : -1
  const nextIndex = index + offset
  if (nextIndex < 0 || nextIndex >= items.length) {
    return undefined
  }
  return items[nextIndex]?._id
}

/** Item to select after archiving `archivedId` (next in list, or previous if last). */
export function getInboxItemIdAfterArchive(
  items: InboxItem[],
  archivedId: string,
): string | undefined {
  const index = items.findIndex((item) => item._id === archivedId)
  if (index === -1) {
    return items[0]?._id
  }
  if (index < items.length - 1) {
    return items[index + 1]?._id
  }
  if (index > 0) {
    return items[index - 1]?._id
  }
  return undefined
}
