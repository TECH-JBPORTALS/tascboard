# Tascboard — Task Management System

Tascboard is a full-stack **task and workflow management system** built using **Convex + Next.js**.  
It is designed to manage projects, tasks, sprints, meetings, employee todos, daily reports, payroll, and collaboration in a structured workflow system.

---

## Tech Stack

- **Convex** — Backend (Database + Server Functions)
- **Next.js** — Frontend Framework
- **React** — UI Components
- **Tailwind CSS** — Styling

---

## Learn More

### Convex Documentation

[https://docs.convex.dev](https://docs.convex.dev)

### Next.js Documentation

[https://nextjs.org/docs](https://nextjs.org/docs)

### React Documentation

[https://react.dev](https://react.dev)

### Tailwind CSS Documentation

[https://tailwindcss.com/docs](https://tailwindcss.com/docs)

---

## Features

- Project → Track → Task hierarchy
- Sprint planning system
- Task assignment with priority & status tracking
- Subtasks, labels, and activity logs
- Meeting management system (recurrence support)
- Employee todo tracking system
- Daily report system
- Payroll management system
- Comments & collaboration system
- Attendance management system
- Leave request system

---

## Setup Instructions

### 1. Clone repository

```bash
git clone <repo-url>
cd tascboard
```

### 2. Install dependencies

```bash
bun install
```

---

### 3. Setup Convex backend

Start Convex locally:

```bash
bunx convex dev
```

This will:

- Start the local Convex backend
- Generate `.env.local`
- Provide required environment variables

---

### 4. Environment variables

After running `bunx convex dev`, a `.env.local` file is created automatically.

Example:

```env
CONVEX_DEPLOYMENT=anonymous:anonymous-tascboard
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

You can find these values:

- In `.env.local`
- Or in the terminal output of `bunx convex dev`

---

### 5. Start development server

```bash
bun run dev
```

