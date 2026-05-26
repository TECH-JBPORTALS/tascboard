import { Suspense } from 'react'
import { SignUpPage } from '@/components/SignUpPage'

export default function Page() {
  return (
    <Suspense>
      <SignUpPage />
    </Suspense>
  )
}
