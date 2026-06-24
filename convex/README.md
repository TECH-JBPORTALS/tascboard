# Convex backend (`convex/`)

This directory holds the Tascboard Convex backend: schema, queries, mutations, and auth integration. Client code calls functions via the generated `api` object from `convex/_generated/api`.

Full per-function reference: **[API.md](./API.md)**.

## Directory layout

| Path | Purpose |
|------|---------|
| `tables/*.ts` | One file per table: `defineTable` + indexes |
| `schema.ts` | Composes `defineSchema`, exports `vv` (`typedV`) |
| `lib/customFunctions.ts` | Auth-wrapped `query` / `mutation` builders |
| `lib/*.ts` | Shared helpers (activity logs, members, kanban, etc.) |
| `*.ts` | Public API modules (e.g. `task.ts`, `project.ts`) |
| `betterAuth/` | Better Auth component (separate schema + `vv`) |
| `auth.ts` | Better Auth client + org/session helpers |
| `__tests__/` | `convex-test` suites |

## Prerequisites

- Convex dev: `npx convex dev` (from project root).
- Frontend must send the Better Auth session (see `ConvexProviderWithAuth` in the app).
- Most product features require an **active organization** on the session (`activeOrganizationId`).

## Custom function builders

Do **not** use raw `query` / `mutation` from `./_generated/server` for app features unless you have a specific reason (e.g. unauthenticated invitation preview). Use the builders in [`lib/customFunctions.ts`](lib/customFunctions.ts).

| Builder | Auth | `ctx.session` includes |
|---------|------|------------------------|
| `privateQuery` | Logged-in user | `userId`, `user`, session fields |
| `privateMutation` | Logged-in user | Same |
| `organizationQuery` | User + active org | Above + `activeOrganizationId`, `employee` (Better Auth member) |
| `organizationMutation` | User + active org | Same |
| `privateInternalQuery` / `privateInternalMutation` | Same as private*, but `internal*` registration | Same |
| `organizationInternalQuery` / `organizationInternalMutation` | Same as org*, but internal | Same |

\*Prefer public builders unless the function should only be called via `internal.*` or `ctx.runMutation(internal.…)`.

### Session fields you can rely on

```ts
// organizationQuery / organizationMutation
const { userId, user, activeOrganizationId, employee } = ctx.session
// employee._id — Better Auth member id (use for employeeId in app tables)
// employee.role — org role string

// privateQuery / privateMutation
const { userId, user } = ctx.session
```

Never accept `userId` or `organizationId` from the client for authorization; take them from `ctx.session`.

## Adding a new function

### 1. Pick the right builder

- **Org-scoped data** (projects, inbox, org employees): `organizationQuery` / `organizationMutation`.
- **User-scoped but not org** (e.g. cross-org profile): `privateQuery` / `privateMutation`.
- **Callable only from backend** (cron, hooks, other mutations): `internalMutation` or `organizationInternalMutation`, and call with `internal.module.fn`.

### 2. Define `args` with `vv` (and `v` where needed)

Import validators from the schema entry point:

```ts
import { v } from 'convex/values'
import { id as storageId } from 'convex-helpers/validators'
import { organizationMutation } from './lib/customFunctions'
import { vv } from './schema'

export const update = organizationMutation({
  args: {
    projectId: vv.id('projects'),
    body: vv
      .doc('projects')
      .omit('_id', '_creationTime', 'organizationId', 'createdAt', 'updatedAt')
      .partial(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { activeOrganizationId } = ctx.session
    // ...
  },
})
```

**Patterns:**

| Need | Use |
|------|-----|
| Document id | `vv.id('tableName')` |
| Create payload | `vv.doc('tableName').omit('_id', '_creationTime', …server fields…)` |
| Partial update | `vv.doc('tableName').omit(…).partial()` inside `args: { id, body }` |
| Single enum field | `vv.doc('tableName').fields.status` |
| File storage id | `storageId('_storage')` from `convex-helpers/validators` (not `vv.id`) |
| Primitives | `v.string()`, `v.number()`, `v.optional(…)`, etc. |

`defineTable` in `tables/` uses `v` from `convex/values` only. `vv` is for function `args` / `returns` and must not be used inside table definitions (circular).

### 3. Add or extend a table (if needed)

1. Create [`tables/myTable.ts`](tables/) with `export const myTable = defineTable({ … }).index(…)`.
2. Register it in [`schema.ts`](schema.ts) inside `defineSchema({ … })`.
3. Run `npx convex dev` to regenerate `_generated` types.

### 4. Register the function

Export a named function from `convex/myModule.ts`. Convex routes it as `api.myModule.myFunction`.

```ts
// Client (React)
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

const create = useMutation(api.project.create)
await create({ name: '…', startDate: 0, endDate: 0, status: 'active' })
```

Always include `args` (and `returns` when the return shape is not obvious). Convex validates client payloads against `args`.

### 5. Queries: indexes, not `filter`

Use `.withIndex(...)` as defined in `tables/`. Avoid `.filter()` on large tables. Return bounded results (`.take()`, pagination) unless the product explicitly needs full scans.

### 6. Mutations: transactions

Keep reads/writes in one mutation when possible. For bulk work, batch with `.take(n)` and `ctx.scheduler.runAfter(0, internal.…)` to continue in another invocation.

## Schema reference

- **Tables:** [`tables/`](tables/)
- **Composed schema + `vv`:** [`schema.ts`](schema.ts)
- **Shared validators (table files):** export a `v.union` / `v.object` from the owning file under [`tables/`](tables/) when the same shape is used in the schema and in client-facing `args` — e.g. [`projectColorValidator`](tables/projects.ts) on `projects.color`.

- **`lib/` helpers:** put **logic** here when more than one query/mutation needs the same behavior, or when a handler would get long. Validators for helper inputs can be derived from `vv` (see [`lib/taskActivityLog.ts`](lib/taskActivityLog.ts)):

  ```ts
  // lib/taskActivityLog.ts — shape matches what logTaskActivity inserts
  const taskActivityInputValidator = vv
    .doc('taskActivities')
    .omit('_id', '_creationTime', 'createdAt')

  type TaskActivityInput = Infer<typeof taskActivityInputValidator>

  export async function logTaskActivity(ctx: MutationCtx, args: TaskActivityInput) {
    // dedupe + insert taskActivities …
  }
  ```

  ```ts
  // task.ts — handler stays thin
  import { logTaskActivity } from './lib/taskActivityLog'

  await logTaskActivity(ctx, {
    taskId,
    actorUserId: ctx.session.userId,
    actorName: ctx.session.user.name,
    kind: 'status_changed',
    fromValue: '…',
    toValue: '…',
  })
  ```

  **Create a `lib/` helper when:**

  | Scenario | Example in repo |
  |----------|------------------|
  | Same DB work called from several functions | [`logTaskActivity`](lib/taskActivityLog.ts) / [`logProjectActivity`](lib/projectActivityLog.ts) from `task.ts`, `label.ts`, `project.ts` |
  | Shared read/enrichment used by multiple queries | [`getProjectMembers`](lib/memberHelper.ts), [`listTasksForTrack`](lib/taskList.ts) |
  | Non-trivial rules (dedupe, cascade, reindex) | [`taskKanban.ts`](lib/taskKanban.ts) |

  **Keep inline in the handler when:** the logic runs once, is a few lines, and is unlikely to be reused. **Do not** add a helper only to wrap a single `ctx.db.insert` with no extra rules.

  Display maps and formatters with no `ctx` (e.g. [`taskDisplay.ts`](lib/taskDisplay.ts)) are fine in `lib/` when shared; auth builders live only in [`customFunctions.ts`](lib/customFunctions.ts).

`employeeId` on app tables is a **string** (Better Auth member `_id`), not `v.id('employee')`.

## Internal and HTTP functions

- **`internal.*`** — Not exposed to the public internet; use for `ctx.runMutation` / crons / component callbacks.
- **`http.ts`** — HTTP routes (e.g. Better Auth webhook).
- **`emails.ts`**, **`taskKanbanMigration.ts`** — Internal actions/mutations only.

See [API.md](./API.md) § Internal functions.

## Testing

```bash
bun run test:convex
```

Tests live under `convex/__tests__/`. They import `schema` from `../schema` and use `convex-test` with a module glob. Component tests may need `t.registerComponent` for Better Auth.

## Further reading

- [Convex functions](https://docs.convex.dev/functions)
- [Convex schema](https://docs.convex.dev/database/schemas)
- [convex-helpers custom functions](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md#custom-functions)
- [typedV / `vv.doc`](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md#validator-utilities)
