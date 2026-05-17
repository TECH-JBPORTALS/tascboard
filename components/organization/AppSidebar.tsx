"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  RiCalendarCheckFill,
  RiCalendarCheckLine,
  RiInboxFill,
  RiInboxLine,
  RiSettings3Line,
  RiTeamFill,
  RiTeamLine,
} from "@remixicon/react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import React from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Inbox", href: "", icon: RiInboxLine, fillIcon: RiInboxFill },
  {
    label: "Employees",
    href: "/employees",
    icon: RiTeamLine,
    fillIcon: RiTeamFill,
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: RiCalendarCheckLine,
    fillIcon: RiCalendarCheckFill,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: RiSettings3Line,
    fillIcon: RiSettings3Line,
  },
] as const;

export function AppSidebar({
  className,
  showTooltip = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & { showTooltip?: boolean }) {
  const pathname = usePathname();
  const params = useParams<{ orgSlug: string }>();
  const basePath = `/${params.orgSlug}`;
  const unreadCount = useQuery(api.inbox.unreadCount);

  return (
    <Sidebar {...props} className={cn("group", className)}>
      <SidebarHeader className="p-2 h-14  justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <OrganizationSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ORGANIZATION</SidebarGroupLabel>
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
                      tooltip={{ children: item.label, hidden: !showTooltip }}
                      render={<Link href={href} />}
                    >
                      {isActive ? <item.fillIcon /> : <item.icon />}
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
    </Sidebar>
  );
}
