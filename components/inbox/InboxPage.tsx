'use client'

import {
  RiArchiveLine,
  RiDeleteBinLine,
  RiInboxUnarchiveLine,
  RiMailForbidLine,
} from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import { motion } from 'motion/react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { api } from '@/convex/_generated/api'
import { Doc, Id } from '@/convex/_generated/dataModel'
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
} from '../ui/alert-dialog'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { InboxOnboardingPanel } from './InboxOnboardingPanel'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { isNull, isUndefined } from 'lodash'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty'

function kindLabel(kind: Doc<'inboxItems'>['kind']): string {
  switch (kind) {
    case 'assignment':
      return 'Assignment'
    case 'comment':
      return 'Comment'
    case 'invite':
      return 'Invite'
    case 'onboarding':
      return 'Onboarding'
    default:
      return 'Update'
  }
}

export function InboxPage() {
  const { inboxItemId, orgSlug } = useParams<{
    inboxItemId: Id<'inboxItems'>
    orgSlug: string
  }>()
  const router = useRouter()
  const selected = useQuery(api.inbox.get, { id: inboxItemId })
  const onboardingStatus = useQuery(
    api.employees.profile.getMyOnboardingStatus,
    {},
  )
  const [_, setActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum(['inbox', 'archive'])
      .withOptions({ clearOnDefault: true })
      .withDefault('inbox'),
  )
  const markReadMutation = useMutation(api.inbox.markRead)
  const archive = useMutation(api.inbox.archive)
  const unarchive = useMutation(api.inbox.unarchive)
  const paramanentlyDelete = useMutation(api.inbox.permanentlyDelete)

  const isOnboardingMessage = selected?.kind === 'onboarding'
  const showOnboardingWizard =
    isOnboardingMessage && onboardingStatus?.onboardingStatus === 'pending'
  const isArchived = selected?.archived === true

  useEffect(() => {
    if (!selected || selected.read || showOnboardingWizard || isArchived) {
      return
    }
    void markReadMutation({ itemId: selected._id })
  }, [selected, markReadMutation, showOnboardingWizard, isArchived])

  function handleArchive(itemId: Id<'inboxItems'>) {
    void archive({ itemId })
    setActiveTab('archive')
  }

  function handleUnarchive(itemId: Id<'inboxItems'>) {
    void unarchive({ itemId })
    setActiveTab('inbox')
  }

  function handlePermanentlyDelete(itemId: Id<'inboxItems'>) {
    void paramanentlyDelete({ itemId })
    router.replace(`/${orgSlug}/?tab=archive`)
  }

  if (isNull(selected))
    return (
      <Empty>
        <EmptyMedia variant="icon" className="size-14">
          <RiMailForbidLine className="size-7 text-muted-foreground" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>This message not found</EmptyTitle>
          <EmptyDescription>
            The message your looking for not found. May it's deleted
            paramanently or else we have some problem. Select another message
            from inbox sidebar.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )

  return (
    <motion.div className="hidden min-h-0 min-w-0 flex-1 flex-col bg-muted/20 md:flex">
      {!selected ? (
        <motion.div
          className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Spinner className="size-5" />
        </motion.div>
      ) : showOnboardingWizard ? (
        <InboxOnboardingPanel
          initialStep={onboardingStatus?.onboardingStep ?? 0}
        />
      ) : (
        <>
          {isArchived ? (
            <div
              className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-sm text-amber-950 dark:text-amber-100"
              role="status"
            >
              This message has been archived.
            </div>
          ) : null}
          <div className="shrink-0 space-y-3 border-b border-border/60 bg-background/80 px-6 py-5 backdrop-blur-sm">
            <motion.div
              className="flex flex-wrap items-center gap-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {kindLabel(selected.kind)}
              </span>
              <time
                className="text-xs text-muted-foreground"
                dateTime={new Date(selected._creationTime).toISOString()}
              >
                {new Date(selected._creationTime).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </time>
            </motion.div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {selected.title}
            </h2>
            {selected.actorName ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selected.actorName}
                </span>
              </p>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {selected.body ?? selected.snippet ?? 'No additional details.'}
            </p>
          </div>
          <motion.div
            className="flex shrink-0 flex-wrap gap-2 border-t border-border/60 bg-background/90 px-6 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isArchived ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8"
                  onClick={() => handleUnarchive(selected._id)}
                >
                  <RiInboxUnarchiveLine className="size-4" />
                  Unarchive
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                      />
                    }
                  >
                    <RiDeleteBinLine className="size-4" />
                    Remove permanently
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete this message permanently?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handlePermanentlyDelete(selected._id)}
                      >
                        Remove permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="h-8"
                onClick={() => handleArchive(selected._id)}
              >
                <RiArchiveLine className="size-4" />
                Archive
              </Button>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
