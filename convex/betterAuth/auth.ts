import { createAuth } from '../auth'

// Export a static instance for Better Auth schema generation
// biome-ignore lint/suspicious/noExplicitAny: <It is a valid use case>
export const auth = createAuth({} as any)
