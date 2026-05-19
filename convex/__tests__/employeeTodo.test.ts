import { beforeEach, describe, expect, test } from "bun:test";
import { convexTest, TestConvexForDataModel } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";
import { DataModel, Id } from "../_generated/dataModel";
import { modules } from "./_modules.test";

describe("EmployeeTodos", () => {
  let t: TestConvexForDataModel<DataModel>;
  let todoId: Id<"employeeTodos">;
  const employeeId = "emp-1";

  beforeEach(async () => {
    t = convexTest(schema, modules).withIdentity({
      userId: "user-1",
      orgId: "org-1",
    });

    todoId = await t.mutation(api.employeeTodos.addEmployeeTodo, {
      employeeId,
      title: "  First todo  ",
      description: "  Do something important  ",
      priority: "medium",
    });
  });

  test("create todo trims title and description, sets defaults", async () => {
    const todo = await t.query(api.employeeTodos.getEmployeeTodo, { todoId });

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

  test("listByEmployee returns todos for the employee", async () => {
    await t.mutation(api.employeeTodos.addEmployeeTodo, {
      employeeId,
      title: "Second todo",
      description: "Another task",
      priority: "high",
    });

    const todos = await t.query(api.employeeTodos.listEmployeeTodosByEmployee, {
      employeeId,
    });

    expect(todos.length).toBe(2);
    expect(todos.every((todo) => todo.employeeId === employeeId)).toBe(true);
  });

  test("listByEmployeeAndStatus returns only matching status", async () => {
    await t.mutation(api.employeeTodos.updateEmployeeTodo, {
      todoId,
      body: {
        isCompleted: true,
      },
    });

    const completed = await t.query(
      api.employeeTodos.listEmployeeTodosByEmployeeAndStatus,
      {
        employeeId,
        isCompleted: true,
      }
    );

    const pending = await t.query(
      api.employeeTodos.listEmployeeTodosByEmployeeAndStatus,
      {
        employeeId,
        isCompleted: false,
      }
    );

    expect(completed.every((todo) => todo.isCompleted)).toBe(true);
    expect(pending.every((todo) => !todo.isCompleted)).toBe(true);
  });

  test("get returns todo by id", async () => {
    const todo = await t.query(api.employeeTodos.getEmployeeTodo, { todoId });

    expect(todo?._id).toBe(todoId);
    expect(todo?.title).toBe("First todo");
  });

  test("update fields individually", async () => {
    await t.mutation(api.employeeTodos.updateEmployeeTodo, {
      todoId,
      body: {
        title: "  Updated title  ",
        description: "  Updated description  ",
        priority: "high",
        isCompleted: true,
      },
    });

    const updated = await t.query(api.employeeTodos.getEmployeeTodo, { todoId });

    expect(updated?.title).toBe("Updated title");
    expect(updated?.description).toBe("Updated description");
    expect(updated?.priority).toBe("high");
    expect(updated?.isCompleted).toBe(true);
    expect(typeof updated?.updatedAt).toBe("number");
  });

  test("update throws if title becomes empty", async () => {
    await expect(
      t.mutation(api.employeeTodos.updateEmployeeTodo, {
        todoId,
        body: {
          title: "   ",
        },
      })
    ).rejects.toThrow("Employee todo title cannot be empty");
  });

  test("toggle flips completion state", async () => {
    const before = await t.query(api.employeeTodos.getEmployeeTodo, { todoId });

    await t.mutation(api.employeeTodos.toggleEmployeeTodo, {
      todoId,
      deviceName: "phone",
    });

    const after = await t.query(api.employeeTodos.getEmployeeTodo, { todoId });

    expect(after?.isCompleted).toBe(!before?.isCompleted);
  });

  test("remove deletes todo", async () => {
    await t.mutation(api.employeeTodos.removeEmployeeTodo, {
      todoId,
      deviceName: "phone",
    });

    const todo = await t.query(api.employeeTodos.getEmployeeTodo, { todoId });
    expect(todo).toBeNull();
  });

  test("create throws if title is empty", async () => {
    await expect(
      t.mutation(api.employeeTodos.addEmployeeTodo, {
        employeeId,
        title: "   ",
        description: "Some description",
        priority: "low",
      })
    ).rejects.toThrow("Employee todo title cannot be empty");
  });
});