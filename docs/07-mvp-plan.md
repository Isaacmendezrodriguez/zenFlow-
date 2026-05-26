# 07. MVP Plan — ZenFlow

## MVP 1 — Core App

Goal: functional personal productivity app with mock data or early Supabase integration.

Includes:

- React + Vite + TypeScript + Tailwind setup
- App layout
- Sidebar
- Topbar
- Routing
- Light theme default
- Dark mode structure
- Dashboard basic
- Backlog Kanban
- Organizations
- Projects
- Add Task modal
- Simple cards
- Complex cards
- Subtasks
- Business rules helpers
- Task detail view
- Links and notes
- Basic weekly calendar UI
- Mock data

## MVP 2 — Supabase Persistence

Goal: real user data.

Includes:

- Supabase Auth
- Protected routes
- Onboarding
- Profiles
- Organizations CRUD
- Projects CRUD
- Tasks CRUD
- Subtasks CRUD
- Links CRUD
- User settings
- RLS policies
- Database migrations

## MVP 3 — Execution Logic

Goal: connect calendar and tasks.

Includes:

- Weekly To-do calendar
- Linked calendar blocks
- Complete calendar blocks
- Apply real hours
- Delete completed block and remove real hours
- Due date validation
- Overlap warning
- Activity logs
- Notifications internal
- Timer widget

## MVP 4 — Historical Tracking

Goal: archive, trash, and metrics.

Includes:

- Archive
- Trash with 3-day retention
- Restore from trash
- Permanent delete
- Dashboard metrics from real data
- Estimated vs real hours
- Overconsumption and saved hours
- Tasks completed on time/late

## MVP 5 — Polish

Goal: better user experience.

Includes:

- Compact backlog view
- Expanded backlog view
- Optional columns
- Settings page
- Priority color customization
- Primary/secondary color customization
- Timer break reminders
- Daily summary
- Improved empty states
- Loading states
- Error states
- Responsive UI

## Later Versions

Future possibilities:

- Real file uploads with Supabase Storage
- Email reminders
- PWA installation
- Export reports
- Realtime sync
- Team collaboration
- Roles and permissions
- Comments
- Recurring calendar blocks
