import { v } from "convex/values";

export const projectColorValidator = v.union(
  v.literal("gray"),
  v.literal("purple"),
  v.literal("blue"),
  v.literal("teal"),
  v.literal("green"),
  v.literal("yellow"),
  v.literal("orange"),
  v.literal("red"),
);
