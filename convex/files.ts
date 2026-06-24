import { v } from 'convex/values'
import { privateMutation, privateQuery } from './helpers/customFunctions'

export const generateUploadUrl = privateMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = ctx.session.userId
    if (!identity) {
      throw new Error('Not authenticated')
    }

    return await ctx.storage.generateUploadUrl()
  },
})

export const getUrl = privateQuery({
  args: { storageId: v.id('_storage') },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = ctx.session.userId
    if (!identity) {
      throw new Error('Not authenticated')
    }

    return await ctx.storage.getUrl(args.storageId)
  },
})
