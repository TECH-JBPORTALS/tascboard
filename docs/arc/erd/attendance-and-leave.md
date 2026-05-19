# Attendance Management data model

Source of truth: `convex/schema.ts`

These tables live in the root Convex application schema.

---

## Core Concept

- Attendance tracks daily employee presence and working hours.
- Leave requests manage employee absence requests with approval workflow.

## Attendance and Leave

```mermaid
erDiagram

    employee {
        Id _id
    }

    attendance {
        Id _id
        string employeeId
        number recordDate
        number loginTime
        number logoutTime
        string status
        number createdAt
        number updatedAt
    }

    leaveRequests {
        Id _id
        string employeeId
        string leaveType
        number startDate
        number endDate
        string reason
        string status
        Id approvedBy FK
        number createdAt
        number updatedAt
    }

    employee ||--o{ attendance : marks
    employee ||--o{ leaveRequests : requests
    employee ||--o{ leaveRequests : approves
```

---

## Field notes

### attendance.status values

- `present`
- `on leave`
- `late`
- `half day`

### attendance.status meanings

- `present` — Employee attended normally.
- `on leave` — Employee is on approved leave.
- `late` — Employee checked in late.
- `half day` — Employee worked partially for the day.

---

### leaveRequests.leaveType values

- `sick`
- `casual`
- `emergency`

### leaveRequests.status values

- `pending`
- `approved`
- `rejected`

### leaveRequests.status meanings

- `pending` — Waiting for approval.
- `approved` — Leave request accepted.
- `rejected` — Leave request denied.

---

## Optional fields

- `attendance.logoutTime` — Optional logout timestamp.
- `attendance.updatedAt` — Optional update timestamp.
- `leaveRequests.approvedBy` — Optional approver reference.
- `leaveRequests.updatedAt` — Optional update timestamp.

---

## Indexes

### attendance

- `by_employee_and_date`
- `by_employee`

### leaveRequests

- `by_employee`
- `by_status`
- `by_approved_by`