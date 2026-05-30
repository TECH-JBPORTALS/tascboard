import { v } from 'convex/values'
import { Doc } from './_generated/dataModel'
import { privateMutation, privateQuery } from './lib/customFunctions'
import { EmployeeTodoPriorityValidator } from './schema'
// GET ALL
export const list = privateQuery({
  args: {
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('employeeTodos')
      .withIndex('by_employee', (q) => q.eq('employeeId', args.employeeId))
      .collect()
  },
})

// GET BY ID
export const get = privateQuery({
  args: {
    todoId: v.id('employeeTodos'),
  },
  handler: async (ctx, { todoId }) => {
    return await ctx.db.get(todoId)
  },
})

// CREATE
export const create = privateMutation({
  args: {
    employeeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: EmployeeTodoPriorityValidator,
  },
  handler: async (ctx, args) => {
    const title = args.title.trim()
    if (!title) throw new Error('Title cannot be empty')

    return await ctx.db.insert('employeeTodos', {
      employeeId: args.employeeId,
      title,
      description: args.description?.trim(),
      priority: args.priority,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// UPDATE
export const update = privateMutation({
  args: {
    todoId: v.id('employeeTodos'),
    body: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      priority: v.optional(
        v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
      ),
      isCompleted: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.todoId)
    if (!todo) throw new Error('Todo not found')

    const patch: Partial<Doc<'employeeTodos'>> = {
      updatedAt: Date.now(),
    }

    if (args.body.title !== undefined) {
      const title = args.body.title.trim()
      if (!title) throw new Error('Title cannot be empty')
      patch.title = title
    }

    if (args.body.description !== undefined) {
      patch.description = args.body.description?.trim()
    }

    if (args.body.priority !== undefined) {
      patch.priority = args.body.priority
    }

    if (args.body.isCompleted !== undefined) {
      patch.isCompleted = args.body.isCompleted
    }

    await ctx.db.patch(args.todoId, patch)
    return null
  },
})

// DELETE
export const remove = privateMutation({
  args: {
    todoId: v.id('employeeTodos'),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.todoId)
    if (!todo) throw new Error('Todo not found')

    await ctx.db.delete(args.todoId)
    return null
  },
})
