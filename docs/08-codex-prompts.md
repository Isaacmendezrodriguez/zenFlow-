# 08. Ready-to-use Codex Prompts

## Prompt A — Ask Codex to Review Context First

```txt
Read AGENTS.md and all files inside /docs.

Do not write code yet.

Summarize:
1. The product goal
2. The business rules
3. The technical architecture
4. The implementation order you recommend
5. Any contradictions or missing decisions you detect

Keep the summary concise but specific.
```

## Prompt B — Create Initial App

```txt
Read AGENTS.md and all files in /docs.

Create the initial React + Vite + TypeScript + Tailwind CSS app for ZenFlow.

Implement:
- AppShell
- Sidebar
- Topbar
- Routing
- Mock data
- Dashboard placeholder
- Backlog placeholder
- To-do semanal placeholder
- Organizations placeholder
- Projects placeholder
- Archive placeholder
- Trash placeholder
- Settings placeholder
- Task detail placeholder

Create reusable UI components:
- Button
- Card
- Badge
- Modal
- Select
- Input
- Textarea
- ProgressBar

Use the UI direction from docs/05-ui-spec.md.

Run build and fix errors.
```

## Prompt C — Implement Business Rules

```txt
Read docs/02-business-rules.md.

Implement business rules in:
- src/lib/business-rules.ts
- src/lib/calculations.ts

Add tests.

Cover:
- simple progress
- complex progress
- estimated hours from subtasks
- real hours from subtasks
- status mapping
- overconsumption
- savings
- due date scheduling validation
- read-only completed cards
- read-only archived cards

Run tests and build.
```

## Prompt D — Implement Supabase Schema

```txt
Read docs/04-database-schema.md.

Create Supabase migrations.

Enable RLS on all tables.
Create user-scoped policies.
Add indexes.
Add updated_at triggers.

Do not implement UI in this task.
```

## Prompt E — Implement Backlog

```txt
Read docs/02-business-rules.md and docs/05-ui-spec.md.

Implement the Backlog page with mock data.

Include:
- Kanban columns
- Optional columns
- Grouping by organization/project
- Priority sorting
- Card UI
- Progress
- Estimated vs real hours
- Due status
- Edit button
- View button
- Compact/expanded view toggle

Run build and fix errors.
```

## Prompt F — Implement Add Task Modal

```txt
Read docs/02-business-rules.md and docs/05-ui-spec.md.

Implement Add Task modal using React Hook Form and Zod.

Include:
- Simple vs complex task selection
- Organization selector with create new option
- Project selector with create new option
- Tags
- Planning fields
- Subtasks for complex cards
- Links and notes

Apply validation rules exactly from docs/02-business-rules.md.

Run build and fix errors.
```
