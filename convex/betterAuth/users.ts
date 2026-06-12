import { v } from 'convex/values'
import { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { vv } from './schema'

const BATCH = 100

export const getById = query({
  args: { id: vv.id('user') },
  returns: vv.nullable(vv.doc('user')),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id)
    return user
  },
})

export const update = mutation({
  args: {
    body: vv.doc('user').pick('name', 'image').partial(),
    userId: vv.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('user', args.userId as Id<'user'>, args.body)
  },
})

export const resetAuthData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    while (true) {
      const users = await ctx.db.query('user').take(BATCH)
      if (users.length === 0) break
      for (const user of users) {
        await ctx.db.delete('user', user._id)
      }
    }

    while (true) {
      const organizations = await ctx.db.query('organization').take(BATCH)
      if (organizations.length === 0) break
      for (const organization of organizations) {
        await ctx.db.delete('organization', organization._id)
      }
    }

    return null
  },
})

export const createOrganization = mutation({
  args: {
    name: vv.string(),
    slug: vv.string(),
  },
  returns: vv.id('organization'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('organization', {
      name: args.name,
      slug: args.slug,
      createdAt: Date.now(),
    })
  },
})
