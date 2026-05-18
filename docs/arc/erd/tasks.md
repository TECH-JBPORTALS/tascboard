# Better Auth data model (Convex component)

Source of truth: [`convex/betterAuth/schema.ts`](../../../convex/betterAuth/schema.ts). Regenerate with:

`bun auth:generate`

These tables live in the **Better Auth Convex component** (`betterAuth`), not in the root app `schema.ts`. String fields like `userId` and `organizationId` reference document `_id` values from the corresponding tables.

Configured plugins (see [`convex/betterAuth/auth.ts`](../../../convex/betterAuth/auth.ts)): **Convex adapter**, **email/password**, **organization**.

---

---
## Sprint Management

```mermaid

erDiagram
    user {
        Id _id
        string email
    }

    tracks {
        Id _id
        number projectId FK
        string title 
        string trackCode  
        string trackLeaderId FK  
        string description
        string status  
        number createdAt
    }

    tasks {
        Id _id
        string projectId FK
        trackId FK
        string taskCode 
        string title
        string description
        string assignedTo FK (employeeId)
        string assignedBy FK (employee_id)
        string priority
        string complexity
        string status
        number startDate
        number endDate
        number createdAt
    }

    sprints {
        Id _id
        string trackId FK
        string sprintName
        string goal
        number startDate
        number endDate
        string status
        string createdBy FK (user_id)
        number createdAt
    }

    tracks ||--o{ sprints : has
    tracks ||--o{ tasks : has
    user ||--o{ sprints : can create
```

