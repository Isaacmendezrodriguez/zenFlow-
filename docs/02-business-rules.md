# 02. Business Rules — ZenFlow

## 1. Organization Rules

1. Every complete task must belong to an organization.
2. When no organization exists and the user creates a task, show an alert asking them to create or select an organization.
3. The organization selector must always include `+ Crear nueva organización`.
4. A new user may create an initial organization during onboarding.
5. The user may skip initial organization setup.
6. If skipped, the user cannot create a complete planned task until an organization exists.

## 2. Project Rules

1. Every complete task must belong to a project.
2. Every project belongs to an organization.
3. A project can move to another organization.
4. When moving a project, all its tasks move with it.
5. A card cannot change project after creation.
6. If work must be moved to another project, create a new independent card or a fix card.
7. Projects can have tags to help filtering and search.

## 3. Task Type Rules

There are two types of cards:

```txt
simple
complex
```

1. The task type is selected when the card is created.
2. The task type cannot be changed after creation.
3. A simple card cannot become complex.
4. A complex card cannot become simple.
5. If the type was selected incorrectly, the user must delete and recreate the card.

## 4. Simple Card Rules

1. A simple card can be created with only title and description.
2. A simple card may not have due date.
3. A simple card may not have estimated hours.
4. A simple card can be used for quick tasks, meetings, sessions, or small tasks.
5. Simple card progress is based on status, not subtasks.
6. A simple card can be linked to calendar blocks.
7. A simple card without organization/project/date/planning does not appear in the weekly To-do calendar.

## 5. Complex Card Rules

1. A complex card requires:
   - Title
   - Description
   - Organization
   - Project
   - Due date
   - Subtasks
   - Estimated hours per subtask
2. Complex card estimated hours are calculated from subtasks.
3. Complex card real hours are calculated from subtasks.
4. The card itself does not have independent hours.
5. Complex card progress is calculated from subtasks.

## 6. Subtask Rules

Each subtask has:

- Title
- Optional description
- Estimated hours
- Real hours
- Priority
- Status

Rules:

1. Subtasks do not have their own due date.
2. The due date belongs to the parent card.
3. Subtasks can be completed from the backlog or weekly To-do calendar.
4. Before completing a subtask manually, ask for real hours.
5. Do not auto-fill remaining estimated hours when completing.
6. If real hours exceed estimated hours, show overconsumption.
7. If real hours are lower than estimated hours, show saved time.
8. If a subtask is deleted, recalculate parent card estimated hours.

## 7. Status Rules

Fixed base statuses:

```txt
not_started
in_progress
done
```

Optional statuses:

```txt
review
blocked
waiting
```

Progress mapping:

```txt
0% -> not_started
1%-99% -> in_progress
100% -> done
```

Rules:

1. If progress is 0%, card is in `not_started`.
2. If progress is greater than 0% and less than 100%, card is in `in_progress`.
3. If progress is 100%, card moves automatically to `done`.
4. If a card is moved to `review`, `blocked`, or `waiting`, progress is paused.
5. Optional columns are enabled from settings.
6. Completed cards are read-only.

## 8. Manual Movement Rules

The user can move cards manually.

When moving a complex card from `not_started` to `in_progress`, show a modal:

- Which subtask was worked on?
- How many real hours were worked?
- Optional comment

When moving a complex card to `done`, show a modal:

- Confirm all subtasks are complete
- Ask for real hours for pending subtasks
- Optional close comment

After confirmation, the card becomes 100% complete.

## 9. Priority Rules

Priorities are fixed:

```txt
urgent
medium
low
```

Default colors:

```txt
urgent -> red
medium -> yellow/orange
low -> green
```

Rules:

1. Priority colors can be edited in settings.
2. Priority appears as label and lateral color stripe.
3. Priority affects card order inside each group.
4. Urgent cards appear first.
5. Medium cards appear second.
6. Low cards appear last.

## 10. Due Date Rules

1. A card can exist without due date if it is simple.
2. Complex cards require due date.
3. Cards with due date must not allow calendar blocks after the due date.
4. If the user tries to schedule after due date, show:

```txt
No puedes programar horas después de la fecha de entrega. Modifica la fecha para continuar.
```

5. Alerts:
   - Due tomorrow
   - Due today
   - Overdue by 1 day

## 11. Calendar Rules

1. The weekly To-do calendar shows Monday to Sunday.
2. Rows represent hours in 24-hour format.
3. Blocks can be linked or unlinked.
4. Blocks can overlap, but show warning.
5. Blocks can be dragged, duplicated, edited, deleted, and completed.
6. If a completed linked block is deleted, its real hours are removed.
7. If a block is linked to a task or subtask and marked completed, it applies real hours.
8. If scheduled hours exceed estimated hours, allow it and show overconsumption.
9. The block duration is calculated from start and end time.

## 12. Timer Rules

1. Timer is optional.
2. Timer starts from a weekly calendar block.
3. Timer can be started, paused, and finished.
4. Timer can suggest 5-minute breaks per hour.
5. Timer does not alter calendar block duration.
6. Timer does not directly control progress.
7. Timer sends internal reminders.

## 13. Notification Rules

Only internal web-app notifications for the first version.

Required notifications:

- 5 minutes before scheduled block
- Task due tomorrow
- Task due today
- Task overdue by 1 day
- Timer break reminder
- Daily summary on app entry

## 14. Link and Workspace Rules

1. No real file uploads in the first version.
2. Cards support links and notes.
3. Links belong to the main card, not subtasks.
4. Link types:
   - Figma
   - Document
   - Meeting
   - SharePoint
   - YouTube
   - Website
   - Other
5. Card detail view must be Notion-like and include:
   - General information
   - Progress
   - Estimated vs real hours
   - Subtasks
   - Links
   - Notes
   - Activity history

## 15. Activity Log Rules

Log events:

- Card created
- Due date changed
- Link added
- Subtask completed
- Real hours registered
- Card moved to done
- Card archived
- Calendar block deleted
- Priority changed

## 16. Archive Rules

1. Completed cards are not archived automatically.
2. User can archive completed cards.
3. Archived cards are read-only.
4. Archived cards cannot be reopened.
5. Archived cards remain available for historical metrics.

## 17. Trash Rules

1. Deleted cards, organizations, and projects go to Trash.
2. Trash keeps items for 3 days.
3. Trash allows:
   - Restore
   - Permanent delete
   - Multi-select
   - Empty trash
4. Show remaining days before permanent delete.

## 18. Organization Deletion Rules

1. An organization with active tasks cannot be deleted directly.
2. If an organization has only completed tasks, it can be deleted with confirmation.
3. Deleted completed tasks go to Trash.
4. There may be an advanced destructive action: delete organization and all cards.
5. That action requires strong confirmation.

## 19. Read-only Rules

1. Completed cards cannot be edited.
2. Archived cards cannot be edited.
3. Archived cards cannot be reopened.
4. Deleted items can only be restored or permanently deleted.
