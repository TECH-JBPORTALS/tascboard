# track Management data model

Source of truth: `convex/schema.ts`

These tables live in the root Convex application schema.

---

Core Concept

A project can have multiple tracks.

Tracks are used to:

organize work into separate areas
split large projects into manageable sections
represent teams, modules, or feature groups

## track

```mermaid

erDiagram

user {
    Id _id
}

project {
    Id _id
}

track {
    Id _id
    Id projectId FK
    string title
    string trackCode
    string description
    string status
    number createdAt
    number updatedAt
}



trackMember {
    Id _id
    Id trackId FK
    Id userId FK
    string role
    number createdAt
}

project ||--o{ track : contains
track ||--o{ trackMember : has
user ||--o{ trackMember : joins

## Field notes

### project.status values
- `todo`
- `in_progress`
- `completed`

### track.status values
- `active`
- `archived`

### 
 - `admin`
- `lead`
- `developer`
- `tester`

### trackMember.role values
- `admin — full control over the track (can manage members, settings, delete/update track)`
- `lead — responsible person who manages and oversees the track work`
- `developer — works on implementation tasks inside the track`
- `tester — responsible for testing and validation of work in the track`