'use client'

import {
  RiBox3Line,
  RiChat3Line,
  RiCheckboxCircleLine,
  RiInbox2Fill,
  RiInbox2Line,
  RiInboxArchiveLine,
  RiMailLine,
  RiNotification3Line,
  RiSparklingLine,
} from '@remixicon/react'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import { formatDistanceToNowStrict } from 'date-fns'
import { isEmpty, isUndefined } from 'lodash'
import { useParams, useRouter } from 'next/navigation'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/convex/_generated/api'
import { Doc, Id } from '@/convex/_generated/dataModel'
import { groupInboxItems, type InboxGroupLabel } from '@/lib/inbox-utils'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty'
import { Skeleton } from '../ui/skeleton'

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

function InboxMessages() {
  const inboxMessages = useQuery(api.inbox.list, {
    filter: 'inbox',
  })
  const groupedMessages = groupInboxItems(inboxMessages ?? [])
  const router = useRouter()
  const { orgSlug, inboxItemId } = useParams<{
    orgSlug: string
    inboxItemId: string
  }>()

  if (isUndefined(inboxMessages))
    return (
      <div className="py-4 flex flex-col gap-1.5 overflow-hidden">
        {Array.from({ length: 14 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-none w-full" />
        ))}
      </div>
    )

  if (isEmpty(groupedMessages))
    return (
      <Empty>
        <EmptyMedia variant="icon" className="size-14">
          <RiInbox2Line className="size-7 text-muted-foreground" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No messages yet</EmptyTitle>
          <EmptyDescription>
            As soon as you get messages, they will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )

  return (
    <MessageList
      ariaLabel="inbox-message"
      groups={groupedMessages}
      listId="inbox-message"
      onSelect={(id) => {
        router.push(`/${orgSlug}/in/${id}`)
      }}
      selectedId={inboxItemId}
    />
  )
}

function ArchiveMessages() {
  const archivedMessages = useQuery(api.inbox.list, {
    filter: 'archive',
  })
  const router = useRouter()
  const { orgSlug, inboxItemId } = useParams<{
    orgSlug: string
    inboxItemId: string
  }>()
  const groupedMessages = groupInboxItems(archivedMessages ?? [])

  if (isUndefined(archivedMessages))
    return (
      <div className="py-4 flex flex-col gap-1.5 overflow-hidden">
        {Array.from({ length: 14 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-none w-full" />
        ))}
      </div>
    )

  if (isEmpty(groupedMessages))
    return (
      <Empty>
        <EmptyMedia variant="icon" className="size-14">
          <RiInboxArchiveLine className="size-7 text-muted-foreground" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>You all catch up</EmptyTitle>
          <EmptyDescription>
            There is no archived messages to show here. You can check inbox now.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant={'outline'}>Go to inbox</Button>
        </EmptyContent>
      </Empty>
    )

  return (
    <div>
      <MessageList
        ariaLabel="inbox-message"
        groups={groupedMessages}
        onSelect={(id) => {
          router.push(`/${orgSlug}/in/${id}?tab=archive`)
        }}
        listId="inbox-message"
        selectedId={inboxItemId}
      />
    </div>
  )
}

export function InboxSidebar() {
  const { inboxItemId } = useParams<{
    inboxItemId?: string
    orgSlug: string
  }>()

  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum(['inbox', 'archive'])
      .withOptions({ clearOnDefault: true })
      .withDefault('inbox'),
  )

  useEffect(() => {
    if (!inboxItemId) {
      return
    }
    document
      .getElementById(`inbox-item-${inboxItemId}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [inboxItemId])

  return (
    <Sidebar collapsible="none" className="hidden flex-1 md:flex">
      <SidebarHeader className="h-(--header-height) border-b justify-center px-3 py-3">
        <div className="flex items-center gap-1.5 px-1">
          <RiInbox2Fill className="size-5" />
          <span className="font-medium">Inbox</span>
        </div>
      </SidebarHeader>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'inbox' | 'archive')}
        className="flex w-full mt-1  flex-col gap-0"
      >
        <TabsList variant="line" className="w-full px-3 border-b">
          <TabsTrigger value="inbox" className="flex-1">
            Inbox
          </TabsTrigger>

          <TabsTrigger value="archive" className="flex-1">
            Archive
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <SidebarContent>
        <SidebarMenu className="flex-1">
          {activeTab === 'inbox' ? <InboxMessages /> : <ArchiveMessages />}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
