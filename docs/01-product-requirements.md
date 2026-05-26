# 01. Product Requirements — ZenFlow

## 1. Product Vision

ZenFlow is a personal productivity web app designed to help users turn a backlog of work into structured execution.

It combines:

- Kanban backlog
- Organizations
- Projects
- Simple and complex task cards
- Subtasks
- Weekly planning calendar
- Estimated vs real hours
- Internal notifications
- Timer
- Productivity dashboard
- Archive
- Trash
- Task workspace with links, notes, and activity history

The app is personal in the first version, not collaborative.

## 2. Core Problem

Users often have many tasks across different organizations or clients, but they lack a simple way to connect:

- What needs to be done
- Which organization/project it belongs to
- How much time was estimated
- How much time was actually used
- When they plan to work on it
- What links and notes belong to the task
- Whether work was completed on time

ZenFlow solves this by connecting backlog, calendar, hours, and task detail into a single system.

## 3. Target User

Initial target user:

- A single person managing work across multiple organizations or projects.
- Examples: Optivosa, Baco, Nadro, Personal.
- The user wants to plan work weekly, track real hours, and compare estimates against actual work.

## 4. Main Navigation

The app must include a fixed left sidebar with these sections:

```txt
Dashboard
Backlog
To-do semanal
Organizaciones
Proyectos
Archivo
Papelera
Configuración
```

At the bottom of the sidebar:

```txt
+ Agregar tarea
```

## 5. Main Screens

The app must include:

1. Login
2. Onboarding
3. Dashboard
4. Backlog Kanban
5. Add Task modal
6. Task detail view
7. To-do weekly calendar
8. Timer widget
9. Organizations
10. Projects
11. Archive
12. Trash
13. Settings

## 6. First Use / Onboarding

When a new user registers, show a welcome screen:

```txt
Bienvenido a ZenFlow
Crea tu primera organización para empezar
```

Fields:

- Organization name
- Optional description

Buttons:

- Crear organización
- Omitir por ahora

If the user skips onboarding, they can enter the app. However, if they try to create a complete task without an organization, show:

```txt
Antes de crear una tarea necesitas crear o seleccionar una organización.
```

The organization selector must always include:

```txt
+ Crear nueva organización
```

## 7. Data Hierarchy

The app follows this hierarchy:

```txt
Organization
  Project
    Tags
    Card
      Subtasks, if complex
      Links
      Notes
      Activity history
      Calendar blocks
      Estimated hours vs real hours
```

## 8. Task Types

There are two task types:

```txt
Simple card
Complex card with subtasks
```

The type is selected when the task is created and cannot be changed later.

## 9. Simple Cards

Simple cards are for quick tasks, sessions, meetings, or small activities.

Minimum fields:

- Title
- Short description

Optional fields:

- Organization
- Project
- Due date
- Priority
- Tags
- Links
- Notes

A simple card can exist without estimated hours.

A simple card can exist without due date.

A simple card can be linked to calendar blocks, but it does not calculate progress from subtasks.

## 10. Complex Cards

Complex cards are for bigger tasks that require breakdown.

Required fields:

- Title
- Description
- Organization
- Project
- Due date
- Subtasks
- Estimated hours per subtask

Optional fields:

- Priority
- Tags
- Links
- Notes

The card itself does not have its own estimated hours.

Estimated hours are calculated by summing all subtask estimated hours.

Real hours are calculated by summing all subtask real hours.

## 11. Backlog

The backlog is a Kanban board with three fixed columns:

```txt
Tareas sin iniciar
Tareas en proceso
Tareas terminadas
```

Optional columns can be enabled from settings:

```txt
En revisión
Bloqueadas
En espera
```

Cards must be grouped visually by organization and project.

The backlog must support:

- Expanded view
- Compact view
- Map/zoom-like navigation for large boards

## 12. Weekly To-do Calendar

The To-do weekly view replaces a separate Today view.

It must show a weekly calendar:

- Monday to Sunday columns
- 24-hour rows
- Blocks like Google Calendar or Microsoft Teams

Blocks can be:

- Free activity
- Personal block
- Meeting
- Work session
- Linked simple card
- Linked complex card
- Linked subtask

Blocks do not have to be linked to a task.

If linked and marked as completed, they add real hours to the related task/subtask.

## 13. Timer

The timer is optional and does not drive the business logic.

It is started from a calendar block.

It must support:

- Start
- Pause
- Finish
- Time remaining
- Optional 5-minute break per hour
- Internal break notification

The timer does not modify calendar duration.

## 14. Dashboard

The dashboard must show productivity metrics:

- Projects worked
- Estimated vs real hours
- Tasks completed on time
- Tasks completed late
- Overdue tasks
- Hours by organization
- Hours by project
- Overconsumption of hours
- Saved hours

## 15. Archive

Completed cards are not automatically archived.

A completed card can be:

- Viewed
- Archived
- Deleted

Archived cards:

- Are read-only
- Cannot be reopened
- Are used as historical records

## 16. Trash

Deleted cards, projects, and organizations go to Trash.

Items remain in Trash for 3 days.

Trash must support:

- Restore
- Delete permanently
- Select multiple
- Empty trash
- Show days remaining before permanent deletion

## 17. Settings

Settings must include:

Visual:

- Light mode
- Dark mode
- Primary color
- Secondary color
- Priority colors

Productivity:

- Internal notifications
- 5-minute reminder before scheduled blocks
- Daily summary
- Timer break setting
- Default break: 5 minutes per hour

Backlog:

- Enable review column
- Enable blocked column
- Enable waiting column
- Compact/expanded view
