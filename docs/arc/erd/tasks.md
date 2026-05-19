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


erDiagram

    projects {
        Id _id
    }

    tracks {
        Id _id
        Id projectId FK
    }


    tasks {
        Id _id
        Id projectId FK
        Id trackId FK
        Id sprintId FK (optional)
        string taskCode
        string title
        string description
        string status
        string assignedTo
        string assignedBy
        string priority
        string complexity
        number startDate
        number endDate
        number createdAt
        number updatedAt
    }

    labels {
        Id _id
        Id projectId FK
        string name
        string color
    }

    taskLabels {
        Id _id
        Id taskId FK
        Id labelId FK
    }

    subtasks {
        Id _id
        Id taskId FK
        string title
        boolean completed
        number order
    }

    activities {
        Id _id
        Id taskId FK
        string deviceName
        string kind
        string fromValue
        string toValue
        string meta
    }

    comments {
        Id _id
        Id taskId FK
        Id parentCommentId FK (optional)
        string deviceName
        string body
        boolean isResolution
        number editedAt
    }
    
     sprints {
        Id _id
        Id trackId FK
        string sprintName
        string goal
        number startDate
        number endDate
        string status
        string createdBy
        number createdAt
        number updatedAt
    }

    projects ||--o{ tracks : contains
    tracks ||--o{ sprints : has
    tracks ||--o{ tasks : contains
    sprints ||--o{ tasks : schedules

    tasks ||--o{ subtasks : has
    tasks ||--o{ activities : logs
    tasks ||--o{ comments : has
    tasks ||--o{ taskLabels : tagged

    labels ||--o{ taskLabels : maps
```


## Final Notes — Task Management Data Model

* `task` — core entity representing a unit of work inside a track and project. It holds execution details such as status, priority, assignment, and timeline.

* `track` — grouping entity for tasks within a project. Tasks are organized under a track for structured workflow management.

* `project` — top-level container that holds tracks and tasks. Defines the overall scope of work.

* `taskId` — unique identifier of a task. Used as the reference key in all related modules like subtasks, activities, comments, and labels.

* `trackId` — references the track under which the task is created. Used to group and filter tasks.

* `projectId` — references the project to which the task belongs.

* `taskCode` — human-readable or system-generated identifier used to uniquely identify a task.

* `title` — name or short description of the task.

* `description` — optional detailed explanation of the task requirements.

* `status` — defines task lifecycle state (`todo`, `in_progress`, `done`).

* `priority` — indicates urgency level of the task (`low`, `medium`, `high`, `critical`).

* `complexity` — indicates difficulty level of the task (`easy`, `medium`, `hard`).

* `assignedTo` — identifier of the employee or user responsible for completing the task.

* `assignedBy` — identifier of the user who created or assigned the task.

* `startDate / endDate` — defines the planned timeline for task execution.

* `createdAt` — timestamp when the task was created.

* `updatedAt` — optional timestamp updated whenever the task is modified.

---

* `labels` — optional tagging system used to categorize tasks within a project.

* `taskLabels` — mapping table that connects tasks and labels in a many-to-many relationship.

* `labelId` — references a label assigned to a task.

---

* `subtasks` — breakdown of a task into smaller executable steps.

* `completed` — indicates whether a subtask is finished.

* `order` — defines the sequence of subtasks.

---

* `activities` — task audit log that tracks all changes made to a task such as status updates, priority changes, and label modifications.

* `kind` — type of change performed on the task.

* `fromValue / toValue` — previous and updated values during a change (optional).

* `meta` — additional optional metadata for the activity record.

---

* `comments` — discussion system linked to a task for collaboration and communication.

* `parentCommentId` — supports nested replies in a comment thread (can be null for root comments).

* `deviceName` — source device or client used to create the comment.

* `body` — content of the comment.

* `editedAt` — optional timestamp when the comment was edited.

* `isResolution` — optional flag marking a comment as the resolution of a discussion thread.

---

* `createdAt / updatedAt` — timestamps used for audit tracking and change history across the entire task system.
