import { Id } from "@/convex/_generated/dataModel";

export type Priority = "low" | "medium" | "high";

export interface Todo {
  _id: Id<"employeeTodos">;
  title: string;
  priority: Priority;
  isCompleted: boolean;
}