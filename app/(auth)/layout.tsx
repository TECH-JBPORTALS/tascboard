import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthGate } from '@/components/auth-gate'
import { isAuthenticated } from '@/lib/auth-server'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isAuthenticated())) {
    const headerStore = await headers()
    const currentPath = headerStore.get('x-current-path') ?? '/'
    redirect(`/sign-in?redirect=${encodeURIComponent(currentPath)}`)
  }
  return <AuthGate>{children}</AuthGate>
}
