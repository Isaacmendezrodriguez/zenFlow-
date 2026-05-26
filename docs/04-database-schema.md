# 04. Database Schema — ZenFlow

This document defines the initial Supabase/Postgres schema.

All user-owned tables must include `user_id`.

All tables must use RLS.

## 1. Tables

Required tables:

```txt
profiles
organizations
projects
project_tags
tasks
subtasks
task_links
calendar_blocks
activity_logs
notifications
user_settings
trash_items
```

## 2. Enums

Recommended Postgres enums or text constraints:

```sql
task_type: simple, complex
task_status: not_started, in_progress, done, review, blocked, waiting
priority: urgent, medium, low
block_status: scheduled, in_progress, completed, cancelled
block_type: free, meeting, personal, simple_task, complex_task, subtask
link_type: figma, document, meeting, sharepoint, youtube, website, other
```

## 3. profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 4. organizations

```sql
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

## 5. projects

```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  name text not null,
  description text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

## 6. project_tags

```sql
create table public.project_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now()
);
```

## 7. tasks

```sql
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  project_id uuid references public.projects(id),

  title text not null,
  description text,
  type text not null check (type in ('simple', 'complex')),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done', 'review', 'blocked', 'waiting')),
  priority text check (priority in ('urgent', 'medium', 'low')),

  due_date date,
  estimated_hours numeric not null default 0,
  real_hours numeric not null default 0,
  progress numeric not null default 0,

  notes text,

  is_archived boolean not null default false,
  archived_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Notes:

- For simple tasks, organization_id and project_id may be null only if the task is not planned.
- For complex tasks, organization_id, project_id, due_date, and subtasks are required by application validation.
- Type cannot change after creation. Enforce in application logic or with DB trigger.

## 8. subtasks

```sql
create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,

  title text not null,
  description text,
  priority text check (priority in ('urgent', 'medium', 'low')),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),

  estimated_hours numeric not null,
  real_hours numeric not null default 0,
  progress numeric not null default 0,

  completed_at timestamptz,
  deleted_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 9. task_links

```sql
create table public.task_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,

  title text not null,
  url text not null,
  type text not null check (type in ('figma', 'document', 'meeting', 'sharepoint', 'youtube', 'website', 'other')),
  description text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 10. calendar_blocks

```sql
create table public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  organization_id uuid references public.organizations(id),
  project_id uuid references public.projects(id),
  task_id uuid references public.tasks(id),
  subtask_id uuid references public.subtasks(id),

  title text not null,
  description text,

  block_type text not null default 'free' check (block_type in ('free', 'meeting', 'personal', 'simple_task', 'complex_task', 'subtask')),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),

  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_hours numeric not null,

  completed_at timestamptz,
  real_hours_applied numeric not null default 0,

  color text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

## 11. activity_logs

```sql
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,

  event_type text not null,
  message text not null,
  metadata jsonb,

  created_at timestamptz default now()
);
```

## 12. notifications

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  message text not null,
  type text,
  is_read boolean not null default false,
  related_task_id uuid references public.tasks(id),
  related_calendar_block_id uuid references public.calendar_blocks(id),

  created_at timestamptz default now()
);
```

## 13. user_settings

```sql
create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  theme text not null default 'light',
  primary_color text default '#2563eb',
  secondary_color text default '#14b8a6',

  urgent_color text default '#ef4444',
  medium_color text default '#f59e0b',
  low_color text default '#22c55e',

  enable_review_column boolean not null default false,
  enable_blocked_column boolean not null default false,
  enable_waiting_column boolean not null default false,

  enable_internal_notifications boolean not null default true,
  notify_before_block_minutes integer not null default 5,
  daily_summary boolean not null default true,
  timer_break_minutes integer not null default 5,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 14. trash_items

```sql
create table public.trash_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  entity_type text not null,
  entity_id uuid not null,
  entity_snapshot jsonb not null,

  deleted_at timestamptz not null default now(),
  permanent_delete_at timestamptz not null default (now() + interval '3 days'),

  created_at timestamptz default now()
);
```

## 15. Indexes

Recommended indexes:

```sql
create index idx_organizations_user_id on public.organizations(user_id);
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_org_id on public.projects(organization_id);
create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_org_id on public.tasks(organization_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_subtasks_task_id on public.subtasks(task_id);
create index idx_calendar_blocks_user_id on public.calendar_blocks(user_id);
create index idx_calendar_blocks_start_at on public.calendar_blocks(start_at);
create index idx_activity_logs_task_id on public.activity_logs(task_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_trash_items_user_id on public.trash_items(user_id);
```

## 16. RLS Policy Pattern

For every user-owned table:

```sql
alter table public.table_name enable row level security;

create policy "Users can select own rows"
on public.table_name
for select
using (user_id = auth.uid());

create policy "Users can insert own rows"
on public.table_name
for insert
with check (user_id = auth.uid());

create policy "Users can update own rows"
on public.table_name
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own rows"
on public.table_name
for delete
using (user_id = auth.uid());
```
