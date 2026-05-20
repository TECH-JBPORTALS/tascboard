import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

const trackMemberReturn = v.object({
  _id: v.id("trackMember"),
  _creationTime: v.number(),
  trackId: v.id("tracks"),
  employeeId: v.string(),
  lead: v.boolean(),
  assignedAt: v.number(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const add = mutation({
  args: {
    trackId: v.id("tracks"),
    employeeId: v.string(),
    lead: v.optional(v.boolean()),
  },
  returns: v.id("trackMember"),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const existing = await ctx.db
      .query("trackMember")
      .withIndex("by_track_employee", (q) =>
        q.eq("trackId", args.trackId).eq("employeeId", args.employeeId),
      )
      .unique();

    if (existing) {
      throw new Error("Already a member");
    }
    if (args.lead) {
      const existingLead = await ctx.db
        .query("trackMember")
        .withIndex("by_track", (q) => q.eq("trackId", args.trackId))
        .filter((q) => q.eq(q.field("lead"), true))
        .first();

      if (existingLead) {
        throw new Error("Lead already exists");
      }
    }

    return await ctx.db.insert("trackMember", {
      trackId: args.trackId,
      employeeId: args.employeeId,
      lead: args.lead ?? false,
      assignedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
    args: {
      memberId: v.id("trackMember"),
      lead: v.optional(v.boolean()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
      await requireIdentity(ctx);
  
      const member = await ctx.db.get(args.memberId);
      if (!member) {
        throw new Error("Member not found");
      }
  
      const patch: Partial<typeof member> = {};
  
      // update lead if provided
      if (args.lead !== undefined) {
        if (args.lead === true) {
          // ensure only one lead per track
          const existingLead = await ctx.db
            .query("trackMember")
            .withIndex("by_track", (q) =>
              q.eq("trackId", member.trackId),
            )
            .filter((q) => q.eq(q.field("lead"), true))
            .first();
  
          // allow same member to stay lead
          if (existingLead && existingLead._id !== member._id) {
            throw new Error("Lead already exists");
          }
        }
  
        patch.lead = args.lead;
      }
  
      patch.updatedAt = Date.now();
  
      await ctx.db.patch(member._id, patch);
  
      return null;
    },
  });

export const remove = mutation({
  args: {
    memberId: v.id("trackMember"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    await ctx.db.delete(args.memberId);
    return null;
  },
});

export const list = query({
  args: { trackId: v.id("tracks") },
  returns: v.array(trackMemberReturn),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const selfMember = await ctx.db
      .query("trackMember")
      .withIndex("by_track_employee", (q) =>
        q.eq("trackId", args.trackId).eq("employeeId", userId),
      )
      .unique();

    if (!selfMember) {
      throw new Error("Not authorized to view this track");
    }

    return await ctx.db
      .query("trackMember")
      .withIndex("by_track", (q) =>
        q.eq("trackId", args.trackId),
      )
      .collect();
  },
});

export const get = query({
  args: { trackId: v.id("tracks") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const { userId } = await requireIdentity(ctx);

    const member = await ctx.db
      .query("trackMember")
      .withIndex("by_track_employee", (q) =>
        q.eq("trackId", args.trackId).eq("employeeId", userId),
      )
      .unique();

    if (!member) {
      throw new Error("Not authorized");
    }

    return await ctx.db.get(args.trackId);
  },
});

export const listTracks = query({
  args: {},
  returns: v.array(v.id("tracks")),
  handler: async (ctx) => {
    const { userId } = await requireIdentity(ctx);

    const memberships = await ctx.db
      .query("trackMember")
      .withIndex("by_employee", (q) =>
        q.eq("employeeId", userId),
      )
      .collect();

    return memberships.map((m) => m.trackId);
  },
});