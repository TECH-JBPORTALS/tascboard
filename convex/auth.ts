import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";

export const requireAuth = query({
  args: {},
  returns: v.string(),
  handler: (ctx) => ctx.runQuery(components.betterAuth.auth.requireAuth),
});

export const requireActiveOrg = query({
  args: {},
  handler: (ctx) => ctx.runQuery(components.betterAuth.auth.requireActiveOrg),
});
