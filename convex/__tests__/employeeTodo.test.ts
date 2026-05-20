import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("EmployeeTodos CRUD", () => {
  let t: TestConvexForDataModel<DataModel>;
  let todoId: Id<"employeeTodos">;

  const employeeId = "emp-1";

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    todoId = await t.mutation(api.employeeTodos.create, {
      employeeId,
      title: "  First todo  ",
      description: "  Do something important  ",
      priority: "medium",
    });
  });

  // CREATE
  test("create trims title and description, sets defaults", async () => {
    const todo = await t.query(api.employeeTodos.get, { todoId });

    expect(todo).not.toBeNull();
    expect(todo?._id).toBe(todoId);
    expect(todo?.employeeId).toBe(employeeId);
    expect(todo?.title).toBe("First todo");
    expect(todo?.description).toBe("Do something important");
    expect(todo?.priority).toBe("medium");
    expect(todo?.isCompleted).toBe(false);
    expect(typeof todo?.createdAt).toBe("number");
    expect(typeof todo?.updatedAt).toBe("number");
  });

  test("create throws if title is empty", async () => {
    await expect(
      t.mutation(api.employeeTodos.create, {
        employeeId,
        title: "   ",
        description: "Some description",
        priority: "low",
      })
    ).rejects.toThrow("Title cannot be empty");
  });

  // LIST
  test("list returns todos for employee", async () => {
    await t.mutation(api.employeeTodos.create, {
      employeeId,
      title: "Second todo",
      description: "Another task",
      priority: "high",
    });

    const todos = await t.query(api.employeeTodos.list, {
      employeeId,
    });

    expect(todos.length).toBe(2);
    expect(todos.every((t) => t.employeeId === employeeId)).toBe(true);
  });

  // GET
  test("get returns todo by id", async () => {
    const todo = await t.query(api.employeeTodos.get, { todoId });

    expect(todo?._id).toBe(todoId);
    expect(todo?.title).toBe("First todo");
  });

  // UPDATE
  test("update modifies fields correctly", async () => {
    await t.mutation(api.employeeTodos.update, {
      todoId,
      body: {
        title: "  Updated title  ",
        description: "  Updated description  ",
        priority: "high",
        isCompleted: true,
      },
    });

    const updated = await t.query(api.employeeTodos.get, { todoId });

    expect(updated?.title).toBe("Updated title");
    expect(updated?.description).toBe("Updated description");
    expect(updated?.priority).toBe("high");
    expect(updated?.isCompleted).toBe(true);
    expect(typeof updated?.updatedAt).toBe("number");
  });

  test("update throws if title becomes empty", async () => {
    await expect(
      t.mutation(api.employeeTodos.update, {
        todoId,
        body: { title: "   " },
      })
    ).rejects.toThrow("Title cannot be empty");
  });

  // DELETE
  test("remove deletes todo", async () => {
    await t.mutation(api.employeeTodos.remove, { todoId });

    const todo = await t.query(api.employeeTodos.get, { todoId });

    expect(todo).toBeNull();
  });
});