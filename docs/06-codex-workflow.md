# 06. Codex Workflow — ZenFlow

## 1. Goal

Use Codex with strong context so it does not lose product logic.

Give Codex:

- Product requirements
- Business rules
- Technical architecture
- Database schema
- UI specification
- MVP plan
- Mockup screenshots
- AGENTS.md

Do not ask Codex to build the entire app in one task.

Use small, focused tasks.

## 2. Recommended Repo Context

Add these files before asking Codex to implement:

```txt
README.md
AGENTS.md
docs/01-product-requirements.md
docs/02-business-rules.md
docs/03-technical-architecture.md
docs/04-database-schema.md
docs/05-ui-spec.md
docs/06-codex-workflow.md
docs/07-mvp-plan.md
docs/mockups/
```

Place Stitch screenshots in:

```txt
docs/mockups/
```

Use clear filenames:

```txt
dashboard.png
backlog.png
task-detail.png
todo-weekly.png
add-task-modal.png
settings.png
```

## 3. How to Prompt Codex

Use this pattern:

```txt
Read AGENTS.md and the docs in /docs.
Implement only [specific feature].
Do not modify unrelated files.
Follow the business rules.
Use TypeScript.
Run build and fix errors.
Summarize changes and mention any assumptions.
```

## 4. First Codex Prompt — Project Setup

```txt
Read AGENTS.md and docs.

Create the initial React + Vite + TypeScript + Tailwind CSS project structure for ZenFlow.

Implement:
- AppShell layout
- Sidebar
- Topbar
- Routes:
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

Create shared UI components:
- Button
- Card
- Badge
- Modal
- Select
- Input
- Textarea
- ProgressBar

Use mock data from src/mocks/mock-data.ts.

Do not connect Supabase yet.

Run build and fix errors.
```

## 5. Second Codex Prompt — Supabase Setup

```txt
Read AGENTS.md and docs/03-technical-architecture.md.

Add Supabase client and authentication structure.

Create:
- src/lib/supabase.ts
- AuthProvider
- protected routes
- login page
- onboarding page
- profile loading helper

Use environment variables:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Do not expose service role keys.
Run build and fix errors.
```

## 6. Third Codex Prompt — Database Migrations

```txt
Read docs/04-database-schema.md and docs/02-business-rules.md.

Create Supabase SQL migrations for:
- profiles
- organizations
- projects
- project_tags
- tasks
- subtasks
- task_links
- calendar_blocks
- activity_logs
- notifications
- user_settings
- trash_items

Enable RLS on all public tables.
Create policies so each user can only access rows where user_id = auth.uid().
Add indexes.
Add updated_at triggers.

Do not implement app UI in this task.
```

## 7. Fourth Codex Prompt — Business Rules

```txt
Read docs/02-business-rules.md.

Implement business rule helpers in src/lib/business-rules.ts and src/lib/calculations.ts.

Add unit tests for:
- simple task progress by status
- complex task progress from subtasks
- estimated hours from subtasks
- real hours from subtasks
- status mapping from progress
- overconsumption and saved time
- cannot schedule after due date
- completed tasks are read-only
- archived tasks are read-only

Run tests and build.
```

## 8. Fifth Codex Prompt — Backlog

```txt
Read docs/05-ui-spec.md and docs/02-business-rules.md.

Implement Backlog page.

Requirements:
- Fixed columns: not_started, in_progress, done
- Optional columns from settings: review, blocked, waiting
- Group cards by organization and project
- Sort cards by priority
- Expanded and compact view toggle
- Each card shows organization/project, type, priority, due date, due status, progress, estimated vs real hours, Edit and View buttons

Use mock data if Supabase service is not ready.

Run build and fix errors.
```

## 9. Sixth Codex Prompt — Add Task Modal

```txt
Read docs/02-business-rules.md and docs/05-ui-spec.md.

Implement Add Task modal.

Sections:
1. Basic info
2. Organization and project
3. Planning
4. Subtasks
5. Workspace

Rules:
- Type is simple or complex.
- Type cannot be changed after creation.
- Simple task can save with title and description.
- Complex task requires organization, project, due date, subtasks, and estimated hours.
- Organization selector includes + Crear nueva organización.
- Project selector includes + Crear nuevo proyecto.
- Project selector depends on selected organization.

Use React Hook Form and Zod validation.

Run build and fix errors.
```

## 10. Seventh Codex Prompt — Weekly Calendar

```txt
Read docs/02-business-rules.md and docs/05-ui-spec.md.

Implement To-do semanal.

Requirements:
- Weekly grid Monday to Sunday
- 24-hour rows
- Create blocks
- Drag blocks
- Duplicate blocks
- Edit blocks
- Delete blocks
- Mark blocks completed
- Warn on overlapping blocks
- Prevent scheduling after linked task due date unless due date is changed
- If completed linked block is deleted, remove associated real hours
- Filters: organization, project, priority, status, tags

Run build and fix errors.
```

## 11. Eighth Codex Prompt — Task Detail

```txt
Read docs/05-ui-spec.md.

Implement task detail view at /tasks/:taskId.

It must show:
- General info
- Organization
- Project
- Type
- Status
- Priority
- Due date
- Progress
- Estimated vs real hours
- Difference
- Overconsumption or savings
- Subtasks
- Links
- Notes
- Activity history
- Alerts

Completed or archived tasks are read-only.

Run build and fix errors.
```

## 12. Ninth Codex Prompt — Dashboard

```txt
Read docs/05-ui-spec.md and docs/02-business-rules.md.

Implement Dashboard with mock or real data.

Show:
- Projects worked
- Estimated vs real hours
- Tasks completed on time
- Tasks completed late
- Overdue tasks
- Hours by organization
- Hours by project
- Overconsumption
- Saved hours

Use simple charts and metric cards.

Run build and fix errors.
```

## 13. Review Instructions for Codex

After each task, Codex should report:

- Files changed
- Main components added
- Business rules implemented
- Any assumptions
- Build/test result
- Follow-up recommendations
