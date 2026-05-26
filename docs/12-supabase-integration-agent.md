# 12. Supabase Integration Agent - ZenFlow

## Purpose

This agent migrates ZenFlow from mock state to Supabase gradually, without breaking the current React prototype.

## Architecture

- Frontend: React, Vite, TypeScript, Tailwind CSS.
- Server state: Supabase Auth and Postgres through feature services.
- Client state: Zustand remains active for mock state, UI filters, timer, and fallback development.
- Business rules remain centralized in `src/lib/business-rules.ts`, `src/lib/calculations.ts`, and `src/lib/validators.ts`.
- Page components must not call Supabase directly. They call feature services or later TanStack Query hooks.

## Required Tables

The foundation uses:

- `profiles`
- `organizations`
- `projects`
- `project_tags`
- `tasks`
- `subtasks`
- `task_links`
- `calendar_blocks`
- `activity_logs`
- `notifications`
- `user_settings`
- `trash_items`

All public user-owned tables include `user_id`, `created_at`, and `updated_at`. Soft-delete tables include `deleted_at`. Tasks include archive and completion timestamps.

## Relationships

- `profiles.id` references `auth.users.id`.
- `organizations.user_id` references `auth.users.id`.
- `projects.organization_id` references `organizations.id`.
- `project_tags.project_id` references `projects.id`.
- `tasks.organization_id` references `organizations.id`.
- `tasks.project_id` references `projects.id`.
- `subtasks.task_id` references `tasks.id`.
- `task_links.task_id` references `tasks.id`.
- `calendar_blocks` may reference organization, project, task, and subtask. Free blocks keep those references null.
- `activity_logs` may reference task and calendar block.
- `notifications` may reference task and calendar block.
- `user_settings.user_id` is unique.
- `trash_items` stores `entity_type`, `entity_id`, and `entity_snapshot`.

## RLS Strategy

RLS is enabled on all public tables. Policies use:

```sql
user_id = auth.uid()
```

For `profiles`, policies use:

```sql
id = auth.uid()
```

Users must not read or mutate another user's rows. `UPDATE` policies include both `using` and `with check` so updates work correctly under RLS.

## Migration Strategy

Migration files live under `supabase/migrations/`. The first migration creates enums, tables, relationships, triggers, indexes, and RLS policies.

Use a development Supabase project first:

```bash
supabase start
supabase db reset
```

The Supabase CLI was not available in the local environment when this file was updated, so the migration file was created manually and must be reviewed before applying.

## Auth Strategy

Supabase Auth is the source of real sessions. `src/features/auth/AuthProvider.tsx` handles:

- Current session
- Current user
- Loading state
- Protected routes
- Public-only login route
- Development fallback when env vars are missing

A private trigger function creates a `profiles` row and default `user_settings` when a new auth user is inserted.

## Service Layer Strategy

Feature services live in:

- `src/features/auth/services/auth.service.ts`
- `src/features/organizations/services/organizations.service.ts`
- `src/features/projects/services/projects.service.ts`
- `src/features/settings/services/settings.service.ts`
- `src/features/tasks/services/tasks.service.ts`
- `src/features/calendar/services/calendar.service.ts`
- `src/features/archive/services/archive.service.ts`
- `src/features/trash/services/trash.service.ts`
- `src/features/dashboard/services/dashboard.service.ts`

Services import `src/lib/supabase.ts`, return typed results, and keep Supabase calls out of page internals.

## Pages Connected First

These are wired to Supabase services with mock fallback:

- Auth
- Onboarding organization creation
- Organizations
- Projects
- Settings save

## Pages Staying Mock Temporarily

These remain on the Zustand mock store until their workflows are migrated safely:

- Backlog
- Task detail
- Add/Edit task modals
- Subtasks
- Calendar / To-do weekly
- Dashboard metrics
- Archive
- Trash
- Timer
- Notifications

## Environment Variables

Frontend variables:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never expose a service role key in the frontend.

## Dev Branch Notes

Work must happen on `dev`. Do not push or commit automatically. Use preview deployment before merging to main.

## Security Rules

- Do not use `user_metadata` for authorization.
- Keep service role keys out of Vite.
- Keep RLS enabled on all exposed public tables.
- Keep `security definer` auth bootstrap functions outside the exposed `public` schema.
- Avoid SQL views until a `security_invoker` strategy is reviewed.
