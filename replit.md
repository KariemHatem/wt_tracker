# WorkTracker

A full-stack work time tracking system for teams, with employee portal, live timer, reports, and admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, base path `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec`)
- Frontend: React + Vite + Tailwind + shadcn/ui + Recharts
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema.ts` — DB schema (users, work_sessions, login_activity)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for all endpoints)
- `lib/api-client-react/src/generated/` — generated Orval hooks and Zod schemas (don't edit)
- `artifacts/api-server/src/` — Express routes, auth middleware, seed script
- `artifacts/work-tracker/src/` — React frontend

## Architecture decisions

- JWT auth stored in localStorage under `wt_token`; `setupApi()` in `main.tsx` wires the bearer token getter into Orval's custom fetch
- Orval hook params are **direct** (not wrapped): `useListSessions({ from, to })` — NOT `useListSessions({ params: { from, to } })`
- Mutation args use `{ id }` not `{ userId }`: `updateUser.mutate({ id, data })`, `deleteUser.mutate({ id })`
- All analytics values are in **hours** (not minutes) in AdminStats: `totalHoursThisWeek`, `totalHoursThisMonth`
- UserUpdate does NOT include `password`; password is only set on user creation via UserCreate

## Product

- **Employee portal**: live session timer (start/stop), today's progress ring, daily/weekly/monthly reports with charts
- **Admin dashboard**: live user monitoring (working/idle/offline status), team stats, daily reports with CSV export, login activity log, weekly/monthly analytics charts

## Seed credentials

- Admin: `admin@company.com` / `admin123`
- Employees: `sarah@company.com`, `michael@company.com`, `aisha@company.com` — all use `password123`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change, then restart the work-tracker workflow
- Run `pnpm --filter @workspace/db run push` after any schema change before restarting the API server
- Optional number fields in reports (`overtimeMinutes`, `missingMinutes`, `productivityPercent`, `completionPercent`) require `?? 0` before arithmetic

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
