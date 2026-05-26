# AGENTS.md

## Project

ZenFlow is a personal productivity web app that combines Kanban backlog, weekly calendar, task tracking, estimated vs real hours, and a Notion-like workspace per task.

## Tech Stack

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase JS Client
- React Router
- React Hook Form
- Zod
- TanStack Query or Zustand
- date-fns
- Lucide React

Do not create an Express, NestJS, or custom Node backend unless explicitly requested.

Node.js is used for frontend tooling, scripts, lint, tests, and build.

Supabase is the backend.

## Main Architecture

Frontend:

- React + Vite + TypeScript + Tailwind CSS

Backend:

- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Supabase Edge Functions only for future server-side jobs

Deployment:

- Frontend: Vercel or Netlify
- Backend: Supabase

## Development Principles

- Keep business rules centralized in `src/lib/business-rules.ts`.
- Keep Supabase queries inside feature services or repositories.
- Do not hardcode business logic inside UI components.
- Do not hardcode mock data inside pages.
- Use reusable UI components.
- Use strict TypeScript types.
- All public database tables must include `user_id`.
- Supabase queries must be scoped to the authenticated user.
- Use Row Level Security for all user-owned tables.
- Keep UI close to the Stitch mockups.
- Prefer small, focused components over large page files.
- Prefer feature-based folder structure.
- Do not introduce unnecessary libraries.

## Business Rules Summary

- Every complete task belongs to an organization and a project.
- A project belongs to an organization.
- A project can move to another organization.
- A card cannot change project after creation.
- A task can be simple or complex.
- Task type cannot change after creation.
- Simple cards can be created quickly with title and description.
- Complex cards require subtasks and estimated hours per subtask.
- Complex card estimated hours are calculated from subtasks.
- Complex card real hours are calculated from subtasks and completed calendar blocks.
- Completed cards are read-only.
- Archived cards are read-only and cannot be reopened.
- Deleted records go to trash and remain there for 3 days.
- Calendar blocks cannot be scheduled after the task due date unless the due date is modified.
- Optional columns are review, blocked, and waiting.
- Progress is paused when a task is in review, blocked, or waiting.

## Commands

Use these commands unless package scripts are changed:

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## Expected Routes

```txt
/login
/onboarding
/dashboard
/backlog
/todo-weekly
/organizations
/projects
/archive
/trash
/settings
/tasks/:taskId
```

## Required Documentation

Before implementing major features, read:

- `docs/01-product-requirements.md`
- `docs/02-business-rules.md`
- `docs/03-technical-architecture.md`
- `docs/04-database-schema.md`
- `docs/05-ui-spec.md`
- `docs/06-codex-workflow.md`
- `docs/07-mvp-plan.md`
