"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  RiAddLargeFill,
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
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import React from "react";
import { cn } from "@/lib/utils";
import { NavPermissionGate } from "./NavPermissionGate";
import type { PermissionRequest } from "@/lib/permissions";

const navItems = [
  { label: "Inbox", href: "", icon: RiInboxLine, fillIcon: RiInboxFill },
  {
    label: "Employees",
    href: "/employees",
    icon: RiTeamLine,
    fillIcon: RiTeamFill,
    permissions: { employee: ["list"] },
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: RiCalendarCheckLine,
    fillIcon: RiCalendarCheckFill,
    permissions: { attendance: ["read"] },
  },
  {
    label: "Settings",
    href: "/settings",
    icon: RiSettings3Line,
    fillIcon: RiSettings3Line,
    permissions: { settings: ["read"] },
  },
];

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

                const link = (
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

                if ("permissions" in item && item.permissions) {
                  return (
                    <NavPermissionGate
                      key={item.label}
                      permissions={item.permissions as PermissionRequest}
                    >
                      {link}
                    </NavPermissionGate>
                  );
                }

                return link;
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects */}
        <ProjectSidebarGroup />
      </SidebarContent>
    </Sidebar>
  );
}

function ProjectSidebarGroup() {
  const pathname = usePathname();
  const params = useParams<{ orgSlug: string }>();
  const basePath = `/${params.orgSlug}`;
  const projects = useQuery(api.project.list);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        PROJECTS
        <SidebarGroupAction
          title="Create project"
          onClick={() => setCreateOpen(true)}
        >
          <RiAddLargeFill />
        </SidebarGroupAction>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects?.map((pro) => {
            const href = `${basePath}/pro/${pro._id}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <SidebarMenuItem key={pro._id}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={{ children: pro.name }}
                  render={<Link href={href} />}
                >
                  <span className="truncate">{pro.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SidebarGroup>
  );
}
