import { TodoPanel } from '@/components/employee-todos/todo-panel'
import { AppSidebar } from '@/components/organization/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
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
  )
}
