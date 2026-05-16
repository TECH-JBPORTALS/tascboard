"use client";

import { Sidebar, SidebarContent, SidebarHeader } from "./ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-xl font-bold font-mono">TASCBOARD</h1>
      </SidebarHeader>
      <SidebarContent></SidebarContent>
    </Sidebar>
  );
}
