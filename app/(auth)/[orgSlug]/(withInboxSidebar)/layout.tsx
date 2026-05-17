import { InboxSidebar } from "@/components/inbox/InboxSidebar";
import { AppSidebar } from "@/components/organization/AppSidebar";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <Sidebar
        collapsible="icon"
        className="overflow-hidden w-fit *:data-[sidebar=sidebar]:flex-row"
      >
        <AppSidebar
          collapsible="none"
          className="border-r w-[16rem]!"
          showTooltip
        />
        <InboxSidebar />
      </Sidebar>
      <SidebarInset>
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
