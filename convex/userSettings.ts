import { v } from 'convex/values'
import { components } from './_generated/api'
import {
  organizationMutation,
  organizationQuery,
  privateMutation,
} from './helpers/customFunctions'

export const getGeneralSettings = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx.session

    const user = await ctx.runQuery(components.betterAuth.users.getById, {
      id: userId,
    })

    if (!user) throw new Error('User not found!')

    return user
  },
})

export const updateProfileImage = privateMutation({
  args: {
    storageId: v.id('_storage'),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const image = await ctx.storage.getUrl(args.storageId)
    if (!image) {
      throw new Error('Failed to resolve image URL')
    }

    const { userId } = ctx.session

    await ctx.runMutation(components.betterAuth.users.update, {
      userId,
      body: { image },
    })

    return image
  },
})

export const updateDisplayName = organizationMutation({
  args: {
    fullName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = ctx.session

    await ctx.runMutation(components.betterAuth.users.update, {
      userId,
      body: { name: args.fullName },
    })

    return null
  },
})
