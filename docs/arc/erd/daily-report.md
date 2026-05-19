# Daily Report  Management data model

Source of truth: `convex/schema.ts`

These tables live in the root Convex application schema.

---

### Core Concept

- `Task daily report tracks the daily progress, status, and updates of assigned tasks, while task stores the main task details and assignment information.`

## daily reports

```mermaid

erDiagram

user {
    Id _id
}
project {
    Id _id
    string name
}

track {
    Id _id
    Id userId FK
    Id projectId FK
    string name
    string status

}


task {
    Id _id
    Id userId FK
    string taskCode
    string title
    string priority
    string status
    number startDate
    number endDate
    number createdAt
    number updatedAt
}


daily_reports {
    Id _id
    Id taskId FK
    Id userId FK
    Id reviewedBy FK
    date reportDate
    text workSummary
    number loginTime
    number logoutTime
    text reviewerRemark
    number createdAt
    number updatedAt
}

project ||--o{ track : contains
track ||--o{ task : contains
task ||--o{ daily_reports : has

user ||--o{ daily_reports : submits
user ||--o{ daily_reports : reviews


---
## Final Notes

  employee_todos — stores personal todo tasks assigned to employees, including task details, priority levels, and completion tracking.

## Functional Purpose

   The employee_todos table helps employees:

      manage daily tasks
      organize personal work items
      track task completion status
      prioritize important activities

It also supports productivity tracking and task management within the organization.