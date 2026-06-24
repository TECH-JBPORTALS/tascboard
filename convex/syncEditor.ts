import { ProsemirrorSync } from '@convex-dev/prosemirror-sync'
import { v } from 'convex/values'
import { components } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { internalMutation } from './_generated/server'
import { ensureActiveOrganization } from './helpers/auth'

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync)
const PROJECT_EDITOR_PREFIX = 'project-'

export const EMPTY_PROSEMIRROR_DOC = { type: 'doc', content: [] as const }

function parseProjectEditorId(id: string): Id<'projects'> {
  if (!id.startsWith(PROJECT_EDITOR_PREFIX)) {
    throw new Error('Invalid project editor id')
  }
  return id.slice(PROJECT_EDITOR_PREFIX.length) as Id<'projects'>
}

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({
  async checkWrite(ctx, id) {
    const activeOrganizationId = await ensureActiveOrganization(ctx)
    const projectId = parseProjectEditorId(id)
    const project = await ctx.db.get(projectId)
    if (!project || project.organizationId !== activeOrganizationId) {
      throw new Error('Not found')
    }
    return void 0
  },
})

export function getProjectEditorId(projectId: Id<'projects'>) {
  return `${PROJECT_EDITOR_PREFIX}${projectId}`
}

export const createEditor = internalMutation({
  args: { id: v.string(), content: v.any() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await prosemirrorSync.create(ctx, args.id, args.content)
    return null
  },
})
