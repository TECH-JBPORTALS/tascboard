# Better Auth data model (Convex component)

Source of truth: [`convex/betterAuth/schema.ts`](../../../convex/betterAuth/schema.ts). Regenerate with:

`bun auth:generate`

These tables live in the **Better Auth Convex component** (`betterAuth`), not in the root app `schema.ts`. String fields like `userId` and `organizationId` reference document `_id` values from the corresponding tables.

Configured plugins (see [`convex/betterAuth/auth.ts`](../../../convex/betterAuth/auth.ts)): **Convex adapter**, **email/password**, **organization**.

---

## Meeting


```mermaid

erDiagram
user{
    Id _id
    name string
    email string
}
organization
{
    Id _id
    user
}

  meeting {
    Id _id
    Id organizationId FK
    Id createdBy FK

    string title
    string description
    string meetingLink

    string recurrenceType
    string recurrenceDays

    string status

    number startTime
    number endTime

    number createdAt
    number updatedAt
  }

   meeting_recipients {
    Id _id PK
    Id meetingId FK
    Id userId FK

    number createdAt
    number updatedAt
  }

   schedule_meetings {
    Id _id PK
    Id meetingId FK
    Id userId FK
    number start_time
    number end_time

    string status

    string final_notes

    number createdAt
    number updatedAt
  }

   meetingAttendees {
    Id _id
    Id scheduleMeetingId FK
    Id userId FK

    string status

    number createdAt
    number updatedAt
  }

 

user ||--o{ meeting : "creates"
organization ||--o{ meeting : "contains"

meeting ||--o{ meeting_recipients : "has recipients"
user ||--o{ meeting_recipients : "is invited"

meeting ||--o{ schedule_meetings : "generates"

schedule_meetings ||--o{ meetingAttendees : "tracks attendance"
user ||--o{ meetingAttendees : "attends"



## Field notes

  user — core entity used across the system. Acts as meeting creator, recipient, and attendee. name and email are required.

  organization — only _id. Used for multi-tenant separation. Every meeting belongs to one organization.

  meeting — template definition of a meeting. createdBy tracks who created it. Actual instances are generated in schedule_meetings.

  recurrenceType — defines repetition logic:
    - "daily" → every day
    - "weekly" → selected weekdays
    - "monthly" → selected weekdays per month

  recurrenceDays — optional. Used only for "weekly" and "monthly".

  meeting_recipients — stores invited users. Does not track attendance.
  
  schedule_meetings — actual meeting occurrences with real start_time, end_time, and status.

   meetingAttendees — tracks who attended each scheduled meeting with status: "present", "absent", "late".

   