import { TodoPanel } from '@/components/employee-todos/todo-panel'
import { AppSidebar } from '@/components/organization/app-sidebar'
import { OrgSlugGuard } from '@/components/organization/org-slug-guard'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { api } from '@/convex/_generated/api'
import { preloadAuthQuery } from '@/lib/auth-server'

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [
    preloadedOrganizationsQuery,
    preloadedActiveOrganizationQuery,
    preloadedMemberRoleQuery,
  ] = await Promise.all([
    preloadAuthQuery(api.auth.listOrganizations),
    preloadAuthQuery(api.auth.getActiveOrganization),
    preloadAuthQuery(api.auth.getActiveMemberRole),
  ])

  return (
    <OrgSlugGuard
      preloadedOrganizationsQuery={preloadedOrganizationsQuery}
      preloadedActiveOrganizationQuery={preloadedActiveOrganizationQuery}
      preloadedMemberRoleQuery={preloadedMemberRoleQuery}
    >
      <SidebarProvider
        style={{ '--header-height': '56px' } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset>
          <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
        {/* Floating Todo Panel — visible on all org pages */}
        <TodoPanel />
      </SidebarProvider>
    </OrgSlugGuard>
  )
}
