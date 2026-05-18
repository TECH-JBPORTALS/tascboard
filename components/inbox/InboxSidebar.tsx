"use client";

import {
  RiNotification3Line,
  RiChat3Line,
  RiCheckboxCircleLine,
  RiMailLine,
  RiSearch2Line,
  RiInbox2Fill,
  RiSparklingLine,
} from "@remixicon/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from "../ui/sidebar";
import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { formatDistanceToNowStrict, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useParams, useRouter } from "next/navigation";

type InboxItem = Doc<"inboxItems">;

function groupLabelForTimestamp(ts: number): "Today" | "Yesterday" | "Earlier" {
  const d = new Date(ts);
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d >= today) {
    return "Today";
  }
  if (d >= yesterday) {
    return "Yesterday";
  }
  return "Earlier";
}

function kindIcon(kind: InboxItem["kind"]) {
  const className = "size-4 shrink-0 text-muted-foreground";
  switch (kind) {
    case "assignment":
      return <RiCheckboxCircleLine className={className} />;
    case "comment":
      return <RiChat3Line className={className} />;
    case "invite":
      return <RiMailLine className={className} />;
    case "onboarding":
      return <RiSparklingLine className={cn(className, "text-primary")} />;
    default:
      return <RiNotification3Line className={className} />;
  }
}

export function InboxSidebar() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;
  const { inboxItemId, orgSlug } = useParams<{
    inboxItemId?: string;
    orgSlug: string;
  }>();
  const router = useRouter();

  const onboardingInboxId = useQuery(
    api.inbox.getOnboardingInboxItemId,
    organizationId ? {} : "skip",
  );
  const onboardingStatus = useQuery(
    api.employees.profile.getMyOnboardingStatus,
    organizationId ? {} : "skip",
  );

  const items = useQuery(
    api.inbox.list,
    organizationId ? { organizationId, filter: "all" } : "skip",
  ) as InboxItem[] | undefined;

  const seedWelcome = useMutation(api.inbox.seedWelcomeItems);

  const grouped = useMemo(() => {
    if (!items?.length) {
      return [];
    }
    const order: Array<"Today" | "Yesterday" | "Earlier"> = [
      "Today",
      "Yesterday",
      "Earlier",
    ];
    const map = new Map<string, InboxItem[]>();
    for (const label of order) {
      map.set(label, []);
    }
    for (const item of items) {
      const label = groupLabelForTimestamp(item._creationTime);
      map.get(label)!.push(item);
    }
    return order
      .map((label) => ({ label, items: map.get(label)! }))
      .filter((g) => g.items.length > 0);
  }, [items]);

  useEffect(() => {
    if (!organizationId || !orgSlug) return;
    if (inboxItemId) return;
    if (onboardingStatus?.onboardingStatus !== "pending") return;
    if (!onboardingInboxId) return;
    router.replace(`/${orgSlug}/in/${onboardingInboxId}`);
  }, [
    organizationId,
    orgSlug,
    inboxItemId,
    onboardingInboxId,
    onboardingStatus?.onboardingStatus,
    router,
  ]);

  useEffect(() => {
    if (!organizationId) {
      return;
    }
    void seedWelcome();
  }, [organizationId, seedWelcome]);

  return (
    <Sidebar collapsible="none" className="hidden flex-1 md:flex">
      <SidebarHeader className="justify-center h-14 border-b">
        <div className="flex gap-3">
          <RiInbox2Fill /> Inbox
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <InputGroup>
            <InputGroupAddon>
              <RiSearch2Line />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." />
          </InputGroup>
        </SidebarGroup>
        {/** Loading state */}
        {items === undefined && (
          <div>
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-none border-b w-full" />
            ))}
          </div>
        )}

        {/** Messages */}
        {grouped.map((group) => (
          <div key={group.label}>
            <div className="sticky top-0 z-10 border-b border-border/30 bg-muted/30 px-4 h-8 flex items-center backdrop-blur-sm">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </span>
            </div>
            <ul className="divide-y divide-border/40">
              {group.items.map((item) => {
                return (
                  <li key={item._id}>
                    <button
                      onClick={() => router.push(`/${orgSlug}/in/${item._id}`)}
                      type="button"
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors",
                        inboxItemId === item._id
                          ? "bg-accent"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          {kindIcon(item.kind)}
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-sm",
                                !item.read
                                  ? "font-semibold text-foreground"
                                  : "font-medium text-foreground/90",
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
                          <div className="flex h-full gap-1.5 flex-col items-end">
                            <time
                              className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                              dateTime={new Date(
                                item._creationTime,
                              ).toISOString()}
                            >
                              {formatDistanceToNowStrict(item._creationTime, {
                                addSuffix: true,
                              })}
                            </time>
                            {!item.read ? (
                              <span
                                className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                                aria-hidden
                              />
                            ) : (
                              <span className="mt-1.5 size-2 shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
