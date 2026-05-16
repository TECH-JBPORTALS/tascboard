# Better Auth data model (Convex component)

Source of truth: [`convex/betterAuth/schema.ts`](../../../convex/betterAuth/schema.ts). Regenerate with:

`bun auth:generate`

These tables live in the **Better Auth Convex component** (`betterAuth`), not in the root app `schema.ts`. String fields like `userId` and `organizationId` reference document `_id` values from the corresponding tables.

Configured plugins (see [`convex/betterAuth/auth.ts`](../../../convex/betterAuth/auth.ts)): **Convex adapter**, **email/password**, **organization**.

---

## Core auth

```mermaid

erDiagram
    user {
        Id _id
        string name
        string email
        boolean emailVerified
        string image
        number createdAt
        number updatedAt
    }

    session {
        Id _id
        number expiresAt
        string token
        number createdAt
        number updatedAt
        string ipAddress
        string userAgent
        string userId
        string activeOrganizationId
    }

    account {
        Id _id
        string accountId
        string providerId
        string userId FK
        string accessToken
        string refreshToken
        string idToken
        number accessTokenExpiresAt
        number refreshTokenExpiresAt
        string scope
        string password
        number createdAt
        number updatedAt
    }

    verification {
        Id _id
        string identifier
        string value
        number expiresAt
        number createdAt
        number updatedAt
    }

    jwks {
        Id _id
        string publicKey
        string privateKey
        number createdAt
        number expiresAt
    }

    user ||--o{ session : has
    user ||--o{ account : has
```

---

## Organizations (`organization()` plugin)

```mermaid

erDiagram
    user {
        Id _id
        string email
    }

    organization {
        Id _id
        string name
        string slug
        string logo
        number createdAt
        string metadata
    }

    member {
        Id _id
        string organizationId
        string userId FK
        string role
        number createdAt
    }

    invitation {
        Id _id
        string organizationId FK
        string email
        string role
        string status
        number expiresAt
        number createdAt
        string inviterId
    }

    session {
        Id _id
        string userId FK
        string activeOrganizationId FK
    }

    organization ||--o{ member : has
    user ||--o{ member : has
    organization ||--o{ invitation : has
    user ||--o{ invitation : invites
    organization ||--o{ session : activeIn
```

---

## Field notes

- **`user`** — `image` and `userId` are optional (nullable in Convex validators).
- **`session`** — `ipAddress`, `userAgent`, and `activeOrganizationId` are optional.
- **`account`** — Provider tokens and `password` are optional; shape depends on provider (email/password vs OAuth).
- **`verification`** — No `userId`; flows use `identifier` + `value` + `expiresAt`.
- **`member`** — Membership is `(organizationId, userId, role)` plus timestamps.
- **`invitation`** — `inviterId` references `user`; `role` optional per validator.

Full indexes remain in `schema.ts` (for example `token`, `slug`, `email_name`).
