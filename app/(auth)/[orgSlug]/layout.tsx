import { OrgSlugGuard } from "@/components/organization/OrgSlugGuard";
import { AppSidebar } from "@/components/organization/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TodoPanel } from "@/components/employee-todos/todo-panel";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgSlugGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
        {/* Floating Todo Panel — visible on all org pages */}
        <TodoPanel />
      </SidebarProvider>
    </OrgSlugGuard>
  );
}