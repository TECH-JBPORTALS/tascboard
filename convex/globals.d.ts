export {}

declare module 'convex/server' {
  interface UserIdentity {
    activeOrganizationId: string | null
    sessionId: string | null
  }
}
