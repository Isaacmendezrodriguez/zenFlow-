# 11. Functional Interaction Agent — ZenFlow

## Purpose

This agent turns the current ZenFlow mock UI into an interactive functional prototype using mock data and client-side state.

The app must still not connect to Supabase.

The goal is to make buttons, modals, validations, calendar interactions, backlog movements, dashboard metrics, archive, trash, organizations, projects, and settings work according to the business rules.

## Context to Read

Before making changes, read:

- AGENTS.md
- README.md
- docs/01-product-requirements.md
- docs/02-business-rules.md
- docs/03-technical-architecture.md
- docs/05-ui-spec.md
- docs/09-screen-validation-agent.md
- docs/10-ui-integration-agent.md
- all TXT files inside docs/mockups/
- current src implementation

## Main Principle

The app must behave like a real product using mock state.

Do not leave buttons as static UI.

Every visible action button must either:
- Execute the expected mock-state logic
- Open the correct modal/panel
- Show a validation message
- Show a confirmation modal
- Be explicitly disabled with a visible reason

## Current Problems to Fix

### 1. Calendar block selection

The weekly calendar currently allows only one-hour blocks or does not correctly map selected hours.

Required behavior:

- User can select multiple consecutive time slots.
- Minimum block duration: 30 minutes or 1 hour depending current grid.
- Maximum block duration for one activity: 4 hours.
- If user selects 09:00 to 11:00, duration must be 2 hours.
- If user selects 09:00 to 13:00, duration must be 4 hours.
- If user tries to select more than 4 hours, show validation:
  "El bloque no puede durar más de 4 horas."
- The selected time range must populate CreateBlockPanel.
- Duration must update when start/end changes.
- Selected block must visually highlight on the calendar.

### 2. Calendar block types

Calendar must support linked and free blocks.

Free blocks:
- breakfast
- lunch
- rest
- meeting
- personal
- focus
- free
- other

Linked blocks:
- simple_task
- complex_task
- subtask

Rules:

- Free blocks do not affect backlog.
- Linked blocks affect backlog only after completion and real hours confirmation.
- Linked blocks show "Afecta backlog".
- Free blocks show "No afecta backlog".

### 3. Calendar completed block logic

When completing linked block:

1. Open ConfirmRealHoursModal.
2. Default real hours = planned duration.
3. User can edit real hours.
4. On confirm:
   - block status becomes completed
   - real hours are applied to task or subtask
   - task progress recalculates
   - backlog state updates
   - dashboard metrics update
   - task activity log gets a new event

When completing free block:

- Mark as completed directly.
- Do not open ConfirmRealHoursModal.
- Do not update backlog.

### 4. Backlog card movement

Backlog cards must move between columns using mock state.

Allowed statuses:

- not_started
- in_progress
- done
- review
- blocked
- waiting

Rules:

- 0% progress = not_started
- 1%-99% progress = in_progress
- 100% progress = done
- review, blocked, waiting pause progress

If user moves simple task:

- Moving to done sets progress to 100.
- Moving to in_progress sets progress to 50 if no better value exists.
- Moving to not_started sets progress to 0 only after confirmation if it had progress.

If user moves complex task from not_started to in_progress:

- Open modal asking:
  - subtask worked on
  - real hours worked
  - optional comment

If user moves complex task to done:

- Validate whether all subtasks are done.
- If not all subtasks are done, open completion modal.
- Ask user to confirm all pending subtasks and enter real hours.
- After confirmation:
  - all subtasks become done
  - task progress becomes 100
  - task status becomes done
  - task becomes read-only

If complex task has pending subtasks and user refuses confirmation:

- Do not move to done.

### 5. Dashboard metrics

Dashboard must not be static.

Dashboard cards must be calculated from mock data state.

Metrics:

- Projects worked
- Real hours / estimated hours
- Tasks completed on time
- Tasks completed late
- Overdue tasks
- Overconsumption
- Saved hours
- Activities completed today or this week
- Calendar blocks completed
- Backlog-linked hours completed
- Free/personal hours completed

Dashboard must update when:

- A calendar block is completed
- A task moves to done
- A subtask gets real hours
- A block is deleted and hours are subtracted
- A task is archived or deleted

### 6. Organizations page actions

Organization buttons must work.

Required actions:

- Edit organization
- Delete organization
- Create organization if button exists

Edit behavior:

- Open modal with name and description.
- Save updates mock state.
- UI updates immediately.

Delete behavior:

- If organization has active tasks, block deletion and show:
  "Esta organización tiene tareas activas. Para eliminarla, primero termina, mueve o borra sus tareas."
- If organization has only completed tasks, allow deletion with confirmation.
- Deleted organization and related completed tasks go to Trash.
- If using destructive action "Borrar organización y todas sus cards", require strong confirmation.

### 7. Projects page actions

Project buttons must work.

Required actions:

- Edit project
- Move project organization
- Delete project
- Manage tags if currently visible

Edit behavior:

- Open modal with project fields.
- Save updates mock state.

Move organization behavior:

- Open modal to select new organization.
- On confirm:
  - project organization changes
  - all tasks under project reflect the new organization
- Show confirmation:
  "Este proyecto y sus tareas se moverán a la nueva organización."

Delete behavior:

- If project has active tasks, block or require strong confirmation.
- If deleted, project and relevant completed cards go to Trash.
- Do not allow cards to change project individually.

### 8. Archive page actions

Archive page buttons must work.

Required behavior:

- Archived cards are read-only.
- Archived cards cannot be reopened.
- View detail works.
- Delete archived card sends it to Trash.
- Filters/search should work if visible.

### 9. Trash page actions

Trash page buttons must work.

Required behavior:

- Restore item
- Delete permanently
- Select multiple
- Empty trash
- Show remaining days before permanent deletion

Trash rules:

- Trash retention is 3 days.
- Non-expired item can be restored.
- Expired item can be permanently deleted.
- Empty trash asks confirmation.

### 10. Settings page actions

Settings buttons/switches must work with mock state.

Required settings:

- Light mode
- Dark mode
- Primary color
- Secondary color
- Priority colors
- Enable review column
- Enable blocked column
- Enable waiting column
- Enable internal notifications
- Notify before block
- Daily summary
- Timer break minutes
- Compact/expanded backlog view

Changing settings must update the UI.

Examples:

- Enabling review column shows the Review column in backlog.
- Changing priority color updates badges or stripes.
- Dark mode toggles the UI if implemented.
- Timer break value updates TimerWidget.

### 11. Task detail actions

Task detail must not be static.

Required behavior:

- View current task data.
- Show activity log.
- Show links.
- Show subtasks.
- If task is completed or archived, edit actions are disabled.
- Add link works with mock state.
- Add note works with mock state.
- Completing subtask asks for real hours.
- Completing subtask recalculates parent progress.

### 12. Add task modal actions

Add task modal must create real mock-state tasks.

Rules:

Simple task:

- Can save with title and description.
- Can optionally include organization/project/date/priority.
- If missing planning info, it appears in backlog but not weekly calendar.

Complex task:

- Requires title, description, organization, project, due date, at least one subtask.
- Every subtask must have estimated hours > 0.
- Estimated task hours = sum of subtask estimated hours.
- Type cannot be changed later.

### 13. Edit task modal actions

Edit task modal must update task mock state.

Rules:

Can edit:

- title
- description
- due date
- priority
- notes
- links
- subtasks if not done/archived

Cannot edit:

- task type
- project

If task is done or archived:

- edit button disabled or opens read-only message.

## Mock State Requirement

Use a central mock state provider or Zustand store.

Recommended:

```txt
src/state/zenflow-store.ts