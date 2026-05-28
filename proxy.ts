import { NextRequest, NextResponse } from 'next/server'

export default function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set(
    'x-current-path',
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
  )

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}
