import { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { vv } from './schema'

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
