import { Suspense } from 'react'
import { SignUpPage } from '@/components/sign-up-page'

export default function Page() {
  return (
    <Suspense>
      <SignUpPage />
    </Suspense>
  )
}
