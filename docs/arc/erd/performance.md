# Better Auth data model (Convex component)

Source of truth: [`convex/betterAuth/schema.ts`](../../../convex/betterAuth/schema.ts). Regenerate with:

`bun auth:generate`

These tables live in the **Better Auth Convex component** (`betterAuth`), not in the root app `schema.ts`. String fields like `userId` and `organizationId` reference document `_id` values from the corresponding tables.

Configured plugins (see [`convex/betterAuth/auth.ts`](../../../convex/betterAuth/auth.ts)): **Convex adapter**, **email/password**, **organization**.

---

## performance


```mermaid

erDiagram

user {
  Id _id
  string name
  string email
}

task {
  Id _id
}

employee_performance_points {
  Id _id

  Id userId FK
  Id awardedBy FK
  Id taskId FK

  number points

  number created_at
  number updated_at
}

user ||--o{ employee_performance_points : "employee"
user ||--o{ employee_performance_points : "awarded_by"
task ||--o{ employee_performance_points : "source"


## Final notes 

   user — core entity used across the system. Represents employees, managers, and admins. Used for awarding and receiving performance points.

   task — reference entity used as the source of work. Performance points can be linked to a task.

   employee_performance_points — stores performance points awarded to a user based on task completion or manual evaluation.

   userId — employee receiving the performance points.

   awardedBy — user who assigns points (manager, team lead, or admin).

   taskId — optional link to the task that triggered the performance reward.
   
   points — numeric score representing performance contribution.

   created_at / updated_at — timestamps used for tracking when points were awarded and modified.
