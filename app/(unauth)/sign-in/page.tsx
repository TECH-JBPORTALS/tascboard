import { Suspense } from 'react'
import { SignInPage } from '@/components/sign-in-page'

export default function Page() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  )
}
