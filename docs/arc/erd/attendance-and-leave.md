# Attendance Management data model

Source of truth: `convex/schema.ts`

These tables live in the root Convex application schema.

---
## Core Concept

-Attendance tracks daily employee presence, while leaveRequest manages absence requests with approval workflow.

### Attendance-and-leave 

```mermaid
erDiagram
    user {
        Id _id
    }

    attendance {
        Id _id
        Id userId FK
        Id updatedBy FK
        number recordDate
        number loginTime
        number logoutTime
        string status
        number overtimeHours   
        number createdAt
        number updatedAt
    }

    leaveRequest {
        Id _id
        Id userId FK
        Id approvedBy FK
        string leaveType
        number startDate
        number endDate
        string reason
        string status
        number createdAt
        number updatedAt
    }

user ||--o{ attendance : has
user ||--o{ leaveRequest : requests
user ||--o{ attendance : updates
user ||--o{ leaveRequest : approves

### Field notes
## attendance.status values
 - `present`
 - `absent`
 - `late`
 - `half_day`
 - `on_leave`

## leaveRequest.status values
 - `pending`
 - `approved`
 - `rejected`
 - `cancelled`

 ## leaveRequest.leaveType values
 - `sick`
 - `casual`
 - `emergency`
 - `maternity`

