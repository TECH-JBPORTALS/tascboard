'use client'

import { useMutation, useQuery } from 'convex/react'
import { useParams, useRouter } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { authClient } from '@/lib/auth-client'
import {
  filterInboxItems,
  flattenInboxGroups,
  getAdjacentInboxItemId,
  getInboxItemIdAfterArchive,
  groupInboxItems,
  type InboxItem,
} from '@/lib/inbox-utils'

export type InboxSidebarTab = 'inbox' | 'archive'

type InboxContextValue = {
  sidebarTab: InboxSidebarTab
  activeTab: InboxSidebarTab
  setSidebarTab: (tab: InboxSidebarTab) => void
  items: InboxItem[] | undefined
  archivedItems: InboxItem[] | undefined
  filteredItems: InboxItem[]
  filteredArchivedItems: InboxItem[]
  groupedItems: ReturnType<typeof groupInboxItems>
  groupedArchivedItems: ReturnType<typeof groupInboxItems>
  flatItems: InboxItem[]
  flatArchivedItems: InboxItem[]
  activeFlatItems: InboxItem[]
  activeGroupedItems: ReturnType<typeof groupInboxItems>
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLUListElement | null>
  selectItem: (id: Id<'inboxItems'>) => void
  selectNext: () => void
  selectPrevious: () => void
  archiveItem: (itemId: Id<'inboxItems'>) => Promise<void>
  unarchiveItem: (itemId: Id<'inboxItems'>) => Promise<void>
  permanentlyDeleteItem: (itemId: Id<'inboxItems'>) => Promise<void>
  deleteAllArchived: () => Promise<void>
  orgSlug: string
}

const InboxContext = createContext<InboxContextValue | null>(null)

export function useInbox() {
  const ctx = useContext(InboxContext)
  if (!ctx) {
    throw new Error('useInbox must be used within InboxProvider')
  }
  return ctx
}

export function InboxProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession()
  const organizationId = session?.session.activeOrganizationId
  const { inboxItemId, orgSlug } = useParams<{
    inboxItemId?: string
    orgSlug: string
  }>()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarTab, setSidebarTab] = useState<InboxSidebarTab>('inbox')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const items = useQuery(
    api.inbox.list,
    organizationId ? { organizationId, filter: 'all' } : 'skip',
  ) as InboxItem[] | undefined

  const archivedItems = useQuery(
    api.inbox.listArchived,
    organizationId ? {} : 'skip',
  ) as InboxItem[] | undefined

  const archiveMutation = useMutation(api.inbox.archive)
  const unarchiveMutation = useMutation(api.inbox.unarchive)
  const permanentlyDeleteMutation = useMutation(api.inbox.permanentlyDelete)
  const deleteAllArchivedMutation = useMutation(api.inbox.deleteAllArchived)

  const filteredItems = useMemo(
    () => filterInboxItems(items ?? [], searchQuery),
    [items, searchQuery],
  )

  const filteredArchivedItems = useMemo(
    () => filterInboxItems(archivedItems ?? [], searchQuery),
    [archivedItems, searchQuery],
  )

  const groupedItems = useMemo(
    () => groupInboxItems(filteredItems),
    [filteredItems],
  )

  const groupedArchivedItems = useMemo(
    () => groupInboxItems(filteredArchivedItems),
    [filteredArchivedItems],
  )

  const flatItems = useMemo(
    () => flattenInboxGroups(groupedItems),
    [groupedItems],
  )

  const flatArchivedItems = useMemo(
    () => flattenInboxGroups(groupedArchivedItems),
    [groupedArchivedItems],
  )

  const activeTab = useMemo((): InboxSidebarTab => {
    if (inboxItemId) {
      if (archivedItems?.some((item) => item._id === inboxItemId)) {
        return 'archive'
      }
      if (items?.some((item) => item._id === inboxItemId)) {
        return 'inbox'
      }
    }
    return sidebarTab
  }, [archivedItems, inboxItemId, items, sidebarTab])

  const activeFlatItems =
    activeTab === 'archive' ? flatArchivedItems : flatItems
  const activeGroupedItems =
    activeTab === 'archive' ? groupedArchivedItems : groupedItems

  const selectItem = useCallback(
    (id: Id<'inboxItems'>) => {
      if (archivedItems?.some((item) => item._id === id)) {
        setSidebarTab('archive')
      } else {
        setSidebarTab('inbox')
      }
      router.push(`/${orgSlug}/in/${id}`)
    },
    [archivedItems, orgSlug, router],
  )

  const selectNext = useCallback(() => {
    const nextId = getAdjacentInboxItemId(activeFlatItems, inboxItemId, 'next')
    if (nextId) {
      selectItem(nextId as Id<'inboxItems'>)
    }
  }, [activeFlatItems, inboxItemId, selectItem])

  const selectPrevious = useCallback(() => {
    const prevId = getAdjacentInboxItemId(
      activeFlatItems,
      inboxItemId,
      'previous',
    )
    if (prevId) {
      selectItem(prevId as Id<'inboxItems'>)
    }
  }, [activeFlatItems, inboxItemId, selectItem])

  const navigateAfterRemoval = useCallback(
    (list: InboxItem[], removedId: Id<'inboxItems'>) => {
      const nextId = getInboxItemIdAfterArchive(list, removedId)
      if (inboxItemId === removedId) {
        if (nextId) {
          selectItem(nextId as Id<'inboxItems'>)
        } else {
          router.push(`/${orgSlug}`)
        }
      }
    },
    [inboxItemId, orgSlug, router, selectItem],
  )

  const archiveItem = useCallback(
    async (itemId: Id<'inboxItems'>) => {
      const activeItems = items ?? []
      const nextId = getInboxItemIdAfterArchive(activeItems, itemId)

      await archiveMutation({ itemId })

      if (inboxItemId === itemId) {
        if (nextId) {
          selectItem(nextId as Id<'inboxItems'>)
        } else {
          router.push(`/${orgSlug}`)
        }
      }

      toast('Message archived', {
        action: {
          label: 'Undo',
          onClick: () => {
            void unarchiveMutation({ itemId })
          },
        },
      })
    },
    [
      archiveMutation,
      inboxItemId,
      items,
      orgSlug,
      router,
      selectItem,
      unarchiveMutation,
    ],
  )

  const unarchiveItem = useCallback(
    async (itemId: Id<'inboxItems'>) => {
      await unarchiveMutation({ itemId })
      setSidebarTab('inbox')
      selectItem(itemId)
      toast('Message restored to inbox')
    },
    [selectItem, unarchiveMutation],
  )

  const permanentlyDeleteItem = useCallback(
    async (itemId: Id<'inboxItems'>) => {
      const list = archivedItems ?? []
      await permanentlyDeleteMutation({ itemId })
      navigateAfterRemoval(list, itemId)
      toast('Message permanently deleted')
    },
    [archivedItems, navigateAfterRemoval, permanentlyDeleteMutation],
  )

  const deleteAllArchived = useCallback(async () => {
    const count = await deleteAllArchivedMutation({})
    if (inboxItemId) {
      router.push(`/${orgSlug}`)
    }
    toast(
      count === 1
        ? '1 archived message deleted'
        : `${count} archived messages deleted`,
    )
  }, [deleteAllArchivedMutation, inboxItemId, orgSlug, router])

  useEffect(() => {
    if (!inboxItemId || items === undefined || archivedItems === undefined) {
      return
    }
    const stillVisible = activeFlatItems.some(
      (item) => item._id === inboxItemId,
    )
    if (stillVisible) {
      return
    }
    const fallbackId = activeFlatItems[0]?._id
    if (fallbackId) {
      router.push(`/${orgSlug}/in/${fallbackId}`)
    } else {
      router.push(`/${orgSlug}`)
    }
  }, [activeFlatItems, archivedItems, inboxItemId, items, orgSlug, router])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return
      }

      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      const isTextInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isTextInput && target === searchInputRef.current) {
        if (event.key === 'ArrowDown' && activeFlatItems.length > 0) {
          event.preventDefault()
          searchInputRef.current?.blur()
          const firstId = activeFlatItems[0]?._id
          if (firstId) {
            selectItem(firstId)
            listRef.current?.focus()
          }
        }
        return
      }

      if (isTextInput) {
        return
      }

      if (activeFlatItems.length === 0) {
        return
      }

      event.preventDefault()
      if (event.key === 'ArrowDown') {
        selectNext()
      } else {
        selectPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeFlatItems, selectItem, selectNext, selectPrevious])

  const value = useMemo<InboxContextValue>(
    () => ({
      sidebarTab,
      activeTab,
      setSidebarTab,
      items,
      archivedItems,
      filteredItems,
      filteredArchivedItems,
      groupedItems,
      groupedArchivedItems,
      flatItems,
      flatArchivedItems,
      activeFlatItems,
      activeGroupedItems,
      searchQuery,
      setSearchQuery,
      searchInputRef,
      listRef,
      selectItem,
      selectNext,
      selectPrevious,
      archiveItem,
      unarchiveItem,
      permanentlyDeleteItem,
      deleteAllArchived,
      orgSlug,
    }),
    [
      activeFlatItems,
      activeGroupedItems,
      archiveItem,
      archivedItems,
      deleteAllArchived,
      filteredArchivedItems,
      filteredItems,
      flatArchivedItems,
      flatItems,
      groupedArchivedItems,
      groupedItems,
      items,
      orgSlug,
      permanentlyDeleteItem,
      searchQuery,
      selectItem,
      selectNext,
      selectPrevious,
      activeTab,
      sidebarTab,
      unarchiveItem,
    ],
  )

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
