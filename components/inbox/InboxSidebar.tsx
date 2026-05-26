'use client'

import {
  RiChat3Line,
  RiCheckboxCircleLine,
  RiInbox2Fill,
  RiMailLine,
  RiNotification3Line,
  RiSearch2Line,
  RiSparklingLine,
} from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import { formatDistanceToNowStrict } from 'date-fns'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/convex/_generated/api'
import { Doc, Id } from '@/convex/_generated/dataModel'
import { authClient } from '@/lib/auth-client'
import type { InboxGroupLabel } from '@/lib/inbox-utils'
import { cn } from '@/lib/utils'
import { useInbox } from './InboxContext'

type InboxItem = Doc<'inboxItems'>

function kindIcon(kind: InboxItem['kind']) {
  const className = 'size-4 shrink-0 text-muted-foreground'
  switch (kind) {
    case 'assignment':
      return <RiCheckboxCircleLine className={className} />
    case 'comment':
      return <RiChat3Line className={className} />
    case 'invite':
      return <RiMailLine className={className} />
    case 'onboarding':
      return <RiSparklingLine className={cn(className, 'text-primary')} />
    default:
      return <RiNotification3Line className={className} />
  }
}

function MessageList({
  groups,
  selectedId,
  onSelect,
  listRef,
  listId,
  ariaLabel,
  showUnreadIndicator = true,
}: {
  groups: Array<{ label: InboxGroupLabel; items: InboxItem[] }>
  selectedId?: string
  onSelect: (id: Id<'inboxItems'>) => void
  listRef?: React.RefObject<HTMLUListElement | null>
  listId: string
  ariaLabel: string
  showUnreadIndicator?: boolean
}) {
  if (groups.length === 0) {
    return null
  }

  return (
    <ul
      id={listId}
      ref={listRef}
      role="listbox"
      aria-label={ariaLabel}
      aria-describedby="inbox-keyboard-hint"
      tabIndex={-1}
      className="outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {groups.map((group) => (
        <li key={group.label} role="presentation">
          <div className="sticky top-0 z-10 flex h-8 items-center border-b border-border/30 bg-muted/30 px-4 backdrop-blur-sm">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </span>
          </div>
          <ul className="divide-y divide-border/40" role="presentation">
            {group.items.map((item) => {
              const selected = selectedId === item._id
              return (
                <li key={item._id} role="presentation">
                  <button
                    id={`inbox-item-${item._id}`}
                    role="option"
                    aria-selected={selected}
                    onClick={() => onSelect(item._id)}
                    type="button"
                    className={cn(
                      'flex w-full gap-3 px-4 py-3 text-left transition-colors',
                      selected ? 'bg-accent' : 'hover:bg-muted/40',
                    )}
                  >
                    <div className="flex w-full items-start gap-2">
                      {kindIcon(item.kind)}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm',
                            showUnreadIndicator && !item.read
                              ? 'font-semibold text-foreground'
                              : 'font-medium text-foreground/90',
                          )}
                        >
                          {item.title}
                        </p>
                        {item.snippet ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.snippet}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex h-full flex-col items-end gap-1.5">
                        <time
                          className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                          dateTime={new Date(item._creationTime).toISOString()}
                        >
                          {formatDistanceToNowStrict(item._creationTime, {
                            addSuffix: true,
                          })}
                        </time>
                        {showUnreadIndicator && !item.read ? (
                          <span
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                            aria-hidden
                          />
                        ) : (
                          <span className="mt-1.5 size-2 shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ul>
  )
}

function InboxTabPanel({
  isLoading,
  showEmptySearch,
  showEmptyList,
  emptyListMessage,
  groups,
  listId,
  ariaLabel,
  showUnreadIndicator,
  listRef,
  selectedId,
  onSelect,
  children,
}: {
  isLoading: boolean
  showEmptySearch: boolean
  showEmptyList: boolean
  emptyListMessage: string
  groups: Array<{ label: InboxGroupLabel; items: InboxItem[] }>
  listId: string
  ariaLabel: string
  showUnreadIndicator: boolean
  listRef?: React.RefObject<HTMLUListElement | null>
  selectedId?: string
  onSelect: (id: Id<'inboxItems'>) => void
  children?: React.ReactNode
}) {
  return (
    <>
      {children}
      {isLoading ? (
        <div>
          {Array.from({ length: 18 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-none border-b" />
          ))}
        </div>
      ) : null}
      {showEmptySearch ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No messages match your search.
        </p>
      ) : null}
      {showEmptyList ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyListMessage}
        </p>
      ) : null}
      {!isLoading && groups.length > 0 ? (
        <MessageList
          groups={groups}
          selectedId={selectedId}
          onSelect={onSelect}
          listRef={listRef}
          listId={listId}
          ariaLabel={ariaLabel}
          showUnreadIndicator={showUnreadIndicator}
        />
      ) : null}
    </>
  )
}

export function InboxSidebar() {
  const { data: session } = authClient.useSession()
  const organizationId = session?.session.activeOrganizationId
  const { inboxItemId, orgSlug } = useParams<{
    inboxItemId?: string
    orgSlug: string
  }>()
  const router = useRouter()

  const {
    activeTab,
    setSidebarTab,
    items,
    archivedItems,
    groupedItems,
    groupedArchivedItems,
    flatItems,
    flatArchivedItems,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    listRef,
    selectItem,
    deleteAllArchived,
  } = useInbox()

  const onboardingInboxId = useQuery(
    api.inbox.getOnboardingInboxItemId,
    organizationId ? {} : 'skip',
  )
  const onboardingStatus = useQuery(
    api.employees.profile.getMyOnboardingStatus,
    organizationId ? {} : 'skip',
  )

  const seedWelcome = useMutation(api.inbox.seedWelcomeItems)

  const inboxLoading = items === undefined
  const archiveLoading = archivedItems === undefined

  useEffect(() => {
    if (!organizationId || !orgSlug) return
    if (inboxItemId) return
    if (onboardingStatus?.onboardingStatus !== 'pending') return
    if (!onboardingInboxId) return
    router.replace(`/${orgSlug}/in/${onboardingInboxId}`)
  }, [
    organizationId,
    orgSlug,
    inboxItemId,
    onboardingInboxId,
    onboardingStatus?.onboardingStatus,
    router,
  ])

  useEffect(() => {
    if (!organizationId) {
      return
    }
    void seedWelcome()
  }, [organizationId, seedWelcome])

  useEffect(() => {
    if (!inboxItemId) {
      return
    }
    document
      .getElementById(`inbox-item-${inboxItemId}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [inboxItemId])

  const archiveCount = archivedItems?.length ?? 0

  const handleTabChange = (value: string) => {
    if (value !== 'inbox' && value !== 'archive') {
      return
    }
    setSidebarTab(value)
    if (!inboxItemId) {
      return
    }
    const inArchive = archivedItems?.some((item) => item._id === inboxItemId)
    if (value === 'inbox' && inArchive) {
      router.push(`/${orgSlug}`)
      return
    }
    if (value === 'archive' && !inArchive) {
      router.push(`/${orgSlug}`)
    }
  }

  return (
    <Sidebar collapsible="none" className="hidden flex-1 md:flex">
      <SidebarHeader className="h-auto border-b px-3 py-3">
        <div className="flex items-center gap-1.5 px-1">
          <RiInbox2Fill className="size-5" />
          <span className="font-medium">Inbox</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="min-h-0 h-10">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex min-h-0 w-full flex-1 mt-1  flex-col gap-0"
        >
          <TabsList variant="line" className="w-full px-3 border-b">
            <TabsTrigger value="inbox" className="flex-1">
              Inbox
            </TabsTrigger>

            <TabsTrigger value="archive" className="flex-1">
              Archive
              {archiveCount > 0 ? (
                <span className="ml-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {archiveCount}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="inbox"
            className="mt-0 flex min-h-0 flex-1 flex-col outline-none"
          >
            <SidebarGroup className="gap-2 px-0">
              <div className="px-3">
                <InputGroup>
                  <InputGroupAddon>
                    <RiSearch2Line aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={searchInputRef}
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search inbox messages"
                    aria-controls="inbox-message-list"
                    aria-activedescendant={
                      inboxItemId ? `inbox-item-${inboxItemId}` : undefined
                    }
                  />
                </InputGroup>
              </div>
              <p className="sr-only" id="inbox-keyboard-hint">
                Use arrow up and arrow down to move between messages. Press
                arrow down from search to jump to the first message.
              </p>
            </SidebarGroup>
            <InboxTabPanel
              isLoading={inboxLoading}
              showEmptySearch={
                !inboxLoading &&
                flatItems.length === 0 &&
                searchQuery.trim() !== ''
              }
              showEmptyList={false}
              emptyListMessage=""
              groups={groupedItems}
              listId="inbox-message-list"
              ariaLabel="Inbox messages"
              showUnreadIndicator
              listRef={activeTab === 'inbox' ? listRef : undefined}
              selectedId={inboxItemId}
              onSelect={selectItem}
            />
          </TabsContent>

          <TabsContent
            value="archive"
            className="mt-0 flex min-h-0 flex-1 flex-col outline-none"
          >
            <SidebarGroup className="gap-2 px-0">
              <div className="px-3">
                <InputGroup>
                  <InputGroupAddon>
                    <RiSearch2Line aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Search archived..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search archived messages"
                    aria-controls="archive-message-list"
                    aria-activedescendant={
                      inboxItemId ? `inbox-item-${inboxItemId}` : undefined
                    }
                  />
                </InputGroup>
              </div>
              {archiveCount > 0 ? (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mx-3 h-8 w-[calc(100%-1.5rem)] text-destructive hover:text-destructive"
                      />
                    }
                  >
                    Remove all
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Remove all archived messages?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {archiveCount} archived{' '}
                        {archiveCount === 1 ? 'message' : 'messages'}. This
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => void deleteAllArchived()}
                      >
                        Remove all
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </SidebarGroup>
            <InboxTabPanel
              isLoading={archiveLoading}
              showEmptySearch={
                !archiveLoading &&
                flatArchivedItems.length === 0 &&
                searchQuery.trim() !== ''
              }
              showEmptyList={
                !archiveLoading &&
                flatArchivedItems.length === 0 &&
                searchQuery.trim() === ''
              }
              emptyListMessage="No archived messages."
              groups={groupedArchivedItems}
              listId="archive-message-list"
              ariaLabel="Archived messages"
              showUnreadIndicator={false}
              listRef={activeTab === 'archive' ? listRef : undefined}
              selectedId={inboxItemId}
              onSelect={selectItem}
            />
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  )
}
