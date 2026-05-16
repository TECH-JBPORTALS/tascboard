import { OrgSlugGuard } from "@/components/organization/OrgSlugGuard";
import { AppSidebar } from "@/components/organization/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgSlugGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </OrgSlugGuard>
  );
}
