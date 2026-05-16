"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import {
  RiCalendarCheckLine,
  RiInboxLine,
  RiSettings3Line,
  RiTeamLine,
} from "@remixicon/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

const navItems = [
  { label: "Inbox", href: "", icon: RiInboxLine },
  { label: "Employees", href: "/employees", icon: RiTeamLine },
  { label: "Attendance", href: "/attendance", icon: RiCalendarCheckLine },
  { label: "Settings", href: "/settings", icon: RiSettings3Line },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams<{ orgSlug: string }>();
  const basePath = `/${params.orgSlug}`;
  const { data: session } = authClient.useSession();
  const orgId = session?.session.activeOrganizationId;
  const unreadCount = useQuery(
    api.inbox.unreadCount,
    orgId ? { organizationId: orgId } : "skip",
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-2">
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const href = `${basePath}${item.href}`;
                const isActive =
                  item.href === ""
                    ? pathname === basePath
                    : pathname.startsWith(href);

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.label === "Inbox" &&
                    typeof unreadCount === "number" &&
                    unreadCount > 0 ? (
                      <SidebarMenuBadge className="bg-primary/15 text-primary">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 text-xs text-muted-foreground">
        Tascboard
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
