import { query } from './_generated/server'
import { vv } from './schema'

export const getById = query({
  args: { id: vv.id('user') },
  returns: vv.nullable(vv.doc('user')),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id)
    return user
  },
})
