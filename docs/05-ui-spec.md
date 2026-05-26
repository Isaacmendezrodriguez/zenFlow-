# 05. UI Specification — ZenFlow

## 1. Visual Direction

The UI should feel:

- Clean
- Professional
- Modern
- Spacious
- Personal productivity focused

Default theme:

- Light/white

Optional theme:

- Dark mode

Allow the user to select:

- Primary color
- Secondary color
- Priority colors

## 2. Layout

Use a fixed left sidebar.

Sidebar items:

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

Bottom button:

```txt
+ Agregar tarea
```

Top bar should include:

- Search
- Filters where relevant
- Notification icon
- Theme toggle
- Avatar

## 3. Dashboard Screen

Dashboard must show:

- Daily summary
- Projects worked
- Estimated vs real hours
- Tasks completed on time
- Tasks completed late
- Overdue tasks
- Hours by organization
- Hours by project
- Overconsumption
- Saved hours

Use metric cards and simple charts.

## 4. Backlog Screen

Backlog columns:

Fixed:

- Tareas sin iniciar
- Tareas en proceso
- Tareas terminadas

Optional:

- En revisión
- Bloqueadas
- En espera

Each column groups cards by:

```txt
Organization / Project
```

Each card must show:

- Title
- Organization / Project
- Type: simple or complex
- Priority label
- Priority stripe
- Due date
- Due status
- Progress bar
- Estimated vs real hours
- Subtask count if complex
- Link count
- Buttons: Vista and Editar

Backlog views:

- Expanded
- Compact
- Map/zoom navigation for large boards

## 5. Add Task Modal

The modal must be divided into sections.

### Section 1: Basic Info

- Title
- Description
- Task type:
  - Simple
  - Complex with subtasks

### Section 2: Organization and Project

- Organization selector
- Fixed option: `+ Crear nueva organización`
- Project selector
- Fixed option: `+ Crear nuevo proyecto`
- Tags

Project selector depends on selected organization.

### Section 3: Planning

- Due date
- Priority
- Estimated hours if needed

### Section 4: Subtasks

Only visible for complex cards.

Each subtask:

- Title
- Optional description
- Estimated hours
- Priority

### Section 5: Workspace

- Links
- Notes

## 6. Task Detail View

The task detail view should feel Notion-like.

It must include:

- General information
- Organization
- Project
- Type
- Status
- Priority
- Due date
- Progress
- Estimated hours
- Real hours
- Difference
- Ahorro / Sobreconsumo status
- Subtasks
- Links
- Notes
- Activity history
- Alerts

Completed or archived cards are read-only.

## 7. To-do Weekly Calendar

Use weekly calendar layout:

Columns:

- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday
- Sunday

Rows:

- 00:00 to 23:00

Blocks should support:

- Free block
- Meeting
- Personal
- Simple task
- Complex task
- Subtask

Block must show:

- Title
- Organization/project if linked
- Duration
- Status
- Color
- Button to start timer if applicable

Filters above calendar:

- Organization
- Project
- Priority
- Status
- Tags

## 8. Timer Widget

Small floating widget.

Shows:

- Block name
- Task if linked
- Time selected
- Time remaining
- Start
- Pause
- Finish
- Break setting

## 9. Organizations Screen

Show organization cards or table.

Each organization shows:

- Name
- Description
- Projects count
- Active tasks
- Completed tasks
- Progress
- Actions: edit, delete

## 10. Projects Screen

Show project cards or table.

Each project shows:

- Name
- Organization
- Tags
- Active tasks
- Completed tasks
- Estimated hours
- Real hours
- Progress
- Actions: edit, delete, move organization

## 11. Archive Screen

Show archived cards.

Fields:

- Title
- Organization
- Project
- Due date
- Completed date
- Archived date
- Estimated hours
- Real hours
- Difference
- Button: View detail

Read-only.

## 12. Trash Screen

Show deleted items.

Fields:

- Entity type
- Name
- Deleted date
- Days remaining
- Restore button
- Delete permanently button
- Multi-select
- Empty trash

## 13. Settings Screen

Sections:

### Visual

- Light mode
- Dark mode
- Primary color
- Secondary color
- Priority colors

### Productivity

- Internal notifications
- Notify 5 minutes before block
- Daily summary
- Timer break
- Default break: 5 minutes per hour

### Backlog

- Enable review column
- Enable blocked column
- Enable waiting column
- Compact view
- Expanded view
