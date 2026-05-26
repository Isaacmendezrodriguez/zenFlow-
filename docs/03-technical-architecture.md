# 03. Technical Architecture — ZenFlow

## 1. Architecture Decision

ZenFlow will use a frontend-first architecture with Supabase as backend.

No custom backend should be created in the first version.

Architecture:

```txt
React Frontend
  |
  | Supabase JS Client
  |
Supabase
  - Auth
  - Postgres
  - Row Level Security
  - Edge Functions, future only
```

## 2. Frontend Stack

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod
- TanStack Query or Zustand
- date-fns
- Lucide React
- FullCalendar or custom weekly calendar

## 3. Backend Stack

Use Supabase:

- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Storage only in future if real file uploads are added
- Supabase Edge Functions only when server-side jobs are required

## 4. Deployment

Recommended:

- Frontend: Vercel
- Backend: Supabase

Environment variables:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Never expose the Supabase service role key in the frontend.

## 5. Suggested Folder Structure

```txt
src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx

    ui/
      Button.tsx
      Modal.tsx
      Select.tsx
      Badge.tsx
      ProgressBar.tsx
      Card.tsx
      Input.tsx
      Textarea.tsx
      Tabs.tsx

  features/
    auth/
      LoginPage.tsx
      OnboardingPage.tsx
      auth-provider.tsx

    dashboard/
      DashboardPage.tsx

    backlog/
      BacklogPage.tsx
      components/
      hooks/
      services/

    tasks/
      TaskDetailPage.tsx
      AddTaskModal.tsx
      EditTaskModal.tsx
      components/
      hooks/
      services/

    subtasks/
      components/
      services/

    organizations/
      OrganizationsPage.tsx
      services/

    projects/
      ProjectsPage.tsx
      services/

    calendar/
      TodoWeeklyPage.tsx
      components/
      services/

    timer/
      TimerWidget.tsx

    archive/
      ArchivePage.tsx

    trash/
      TrashPage.tsx

    settings/
      SettingsPage.tsx

    notifications/
      NotificationCenter.tsx

  lib/
    supabase.ts
    business-rules.ts
    calculations.ts
    dates.ts
    constants.ts
    validators.ts

  types/
    database.ts
    domain.ts

  mocks/
    mock-data.ts

  styles/
    index.css
```

## 6. State Management

Use one of these approaches:

Option A:

- TanStack Query for server state
- React local state for UI
- Zustand for global UI settings like theme, sidebar, filters

Option B:

- Zustand for all client state
- Supabase services for persistence

Recommendation:

Use TanStack Query for Supabase data fetching and mutations.

Use Zustand for:

- Sidebar state
- Theme state
- Active filters
- Timer state

## 7. Business Logic Layer

Keep business logic in:

```txt
src/lib/business-rules.ts
src/lib/calculations.ts
```

Examples:

- calculateSimpleTaskProgress
- calculateComplexTaskProgress
- getTaskStatusFromProgress
- calculateEstimatedHours
- calculateRealHours
- calculateOverconsumption
- canEditTask
- canArchiveTask
- canScheduleBlock
- validateTaskCreation

UI components should call these helpers instead of duplicating logic.

## 8. Supabase Access Pattern

Create services per feature:

```txt
src/features/tasks/services/tasks.service.ts
src/features/projects/services/projects.service.ts
src/features/organizations/services/organizations.service.ts
src/features/calendar/services/calendar.service.ts
```

Each service should contain Supabase queries.

Do not call Supabase directly from deeply nested UI components.

## 9. Security

All user-owned tables must have:

- `user_id`
- RLS enabled
- Policies for select/insert/update/delete limited to `auth.uid()`

All frontend queries must operate with the authenticated user.

## 10. Testing

Use unit tests for business rules.

Recommended test coverage:

- Progress calculation
- Status mapping
- Estimated vs real hours
- Overconsumption / savings
- Scheduling after due date
- Completed read-only behavior
- Archive read-only behavior

## 11. Implementation Order

1. Project setup
2. Tailwind theme and layout
3. Routes and app shell
4. Mock screens
5. Supabase schema
6. Auth and onboarding
7. Organizations
8. Projects
9. Tasks and subtasks
10. Backlog
11. Task detail
12. Weekly calendar
13. Dashboard
14. Archive and Trash
15. Settings
16. Timer
17. Notifications
