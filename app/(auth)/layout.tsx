import { redirect } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { isAuthenticated, preloadAuthQuery } from '@/lib/auth-server'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isAuthenticated())) redirect('/sign-in')
  return children
}
