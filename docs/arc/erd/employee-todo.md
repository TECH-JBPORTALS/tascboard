# Better Auth data model (Convex component)

Source of truth: [`convex/betterAuth/schema.ts`](../../../convex/betterAuth/schema.ts). Regenerate with:

`bun auth:generate`

These tables live in the **Better Auth Convex component** (`betterAuth`), not in the root app `schema.ts`. String fields like `userId` and `organizationId` reference document `_id` values from the corresponding tables.

Configured plugins (see [`convex/betterAuth/auth.ts`](../../../convex/betterAuth/auth.ts)): **Convex adapter**, **email/password**, **organization**.

---

## daily reports

```mermaid

erDiagram

user {
  Id _id
  string name
  string email
}

employee_todos {
  Id _id
  Id employee_id

  string title
  string description
  string priority
  boolean is_complete

  number created_at
  number updated_at
}

user ||--o{ employee_todos : "assigned to"




## Field Notes

  employee_todos — stores todo items for employees including task details, priority, and completion status.

  employee_id — references the user who owns the todo.
  
  title — short name of the task.

  description — detailed explanation of the task.

  priority — defines importance level:
       -"low"
       -"medium"
       -"high"

  is_complete — indicates task status:
        false → pending
        true → completed

   created_at / updated_at — timestamps for tracking creation and updates.