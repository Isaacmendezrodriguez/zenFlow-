-- ZenFlow initial Supabase schema.
-- Run only against a development Supabase project until reviewed.

create extension if not exists pgcrypto;

create schema if not exists private;

create type public.task_type as enum ('simple', 'complex');
create type public.task_status as enum ('not_started', 'in_progress', 'done', 'review', 'blocked', 'waiting');
create type public.priority as enum ('urgent', 'medium', 'low');
create type public.calendar_block_type as enum ('free', 'meeting', 'personal', 'breakfast', 'lunch', 'rest', 'focus', 'simple_task', 'complex_task', 'subtask', 'other');
create type public.calendar_block_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled', 'not_completed', 'rescheduled');
create type public.link_type as enum ('figma', 'document', 'meeting', 'sharepoint', 'youtube', 'website', 'other');
create type public.theme_mode as enum ('light', 'dark');
create type public.trash_entity_type as enum ('task', 'organization', 'project');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  description text,
  color text not null default '#10a37f',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid references public.projects(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  type public.task_type not null,
  status public.task_status not null default 'not_started',
  priority public.priority not null default 'medium',
  due_date date,
  estimated_hours numeric(10,2) not null default 0 check (estimated_hours >= 0),
  real_hours numeric(10,2) not null default 0 check (real_hours >= 0),
  progress numeric(5,2) not null default 0 check (progress >= 0),
  notes text,
  is_archived boolean not null default false,
  archived_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planned_task_has_org_project check (
    status = 'not_started'
    or (organization_id is not null and project_id is not null)
  )
);

comment on column public.tasks.project_id is 'Immutable after creation by app rule and trigger. Move work by creating a new task.';
comment on column public.tasks.type is 'Immutable after creation by app rule and trigger.';

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  priority public.priority not null default 'medium',
  status public.task_status not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  estimated_hours numeric(10,2) not null default 0 check (estimated_hours >= 0),
  real_hours numeric(10,2) not null default 0 check (real_hours >= 0),
  progress numeric(5,2) not null default 0 check (progress >= 0),
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  url text not null check (length(trim(url)) > 0),
  type public.link_type not null default 'other',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  subtask_id uuid references public.subtasks(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  description text,
  block_type public.calendar_block_type not null default 'free',
  status public.calendar_block_status not null default 'scheduled',
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_hours numeric(10,2) not null check (duration_hours >= 0),
  real_hours_applied numeric(10,2) not null default 0 check (real_hours_applied >= 0),
  affects_backlog boolean not null default false,
  is_recurring boolean not null default false,
  recurrence_rule jsonb,
  completed_at timestamptz,
  deleted_at timestamptz,
  color text not null default '#d1fae5',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_block_valid_time check (end_at > start_at),
  constraint calendar_block_link_consistency check (
    (affects_backlog = false and task_id is null and subtask_id is null)
    or (affects_backlog = true and (task_id is not null or subtask_id is not null))
  )
);

comment on table public.calendar_blocks is 'App validates max duration of 4 hours, due date limits, overlap warning, and real-hour application.';

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  calendar_block_id uuid references public.calendar_blocks(id) on delete set null,
  event_type text not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('reminder', 'due', 'timer', 'summary')),
  is_read boolean not null default false,
  related_task_id uuid references public.tasks(id) on delete set null,
  related_calendar_block_id uuid references public.calendar_blocks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme public.theme_mode not null default 'light',
  primary_color text not null default '#0f62fe',
  secondary_color text not null default '#10b981',
  priority_colors jsonb not null default '{"urgent":"#ba1a1a","medium":"#f59e0b","low":"#22c55e"}'::jsonb,
  enable_review_column boolean not null default true,
  enable_blocked_column boolean not null default true,
  enable_waiting_column boolean not null default false,
  enable_internal_notifications boolean not null default true,
  notify_before_block_minutes integer not null default 5 check (notify_before_block_minutes >= 0),
  daily_summary boolean not null default true,
  timer_break_minutes integer not null default 5 check (timer_break_minutes >= 0),
  backlog_view text not null default 'expanded' check (backlog_view in ('compact', 'expanded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trash_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type public.trash_entity_type not null,
  entity_id uuid not null,
  name text not null,
  entity_snapshot jsonb not null,
  deleted_at timestamptz not null default now(),
  permanent_delete_at timestamptz not null default (now() + interval '3 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_task_identity_changes()
returns trigger
language plpgsql
as $$
begin
  if new.type is distinct from old.type then
    raise exception 'Task type cannot change after creation';
  end if;
  if new.project_id is distinct from old.project_id then
    raise exception 'Task project cannot change after creation';
  end if;
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger project_tags_updated_at before update on public.project_tags for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger subtasks_updated_at before update on public.subtasks for each row execute function public.set_updated_at();
create trigger task_links_updated_at before update on public.task_links for each row execute function public.set_updated_at();
create trigger calendar_blocks_updated_at before update on public.calendar_blocks for each row execute function public.set_updated_at();
create trigger activity_logs_updated_at before update on public.activity_logs for each row execute function public.set_updated_at();
create trigger notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();
create trigger user_settings_updated_at before update on public.user_settings for each row execute function public.set_updated_at();
create trigger trash_items_updated_at before update on public.trash_items for each row execute function public.set_updated_at();

create trigger prevent_task_identity_changes before update on public.tasks for each row execute function public.prevent_task_identity_changes();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create index organizations_user_id_idx on public.organizations(user_id);
create index organizations_deleted_at_idx on public.organizations(deleted_at);
create index projects_user_id_idx on public.projects(user_id);
create index projects_organization_id_idx on public.projects(organization_id);
create index projects_deleted_at_idx on public.projects(deleted_at);
create index project_tags_user_id_idx on public.project_tags(user_id);
create index project_tags_project_id_idx on public.project_tags(project_id);
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_organization_id_idx on public.tasks(organization_id);
create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_due_date_idx on public.tasks(due_date);
create index tasks_deleted_at_idx on public.tasks(deleted_at);
create index tasks_is_archived_idx on public.tasks(is_archived);
create index subtasks_user_id_idx on public.subtasks(user_id);
create index subtasks_task_id_idx on public.subtasks(task_id);
create index subtasks_deleted_at_idx on public.subtasks(deleted_at);
create index task_links_user_id_idx on public.task_links(user_id);
create index task_links_task_id_idx on public.task_links(task_id);
create index calendar_blocks_user_id_idx on public.calendar_blocks(user_id);
create index calendar_blocks_organization_id_idx on public.calendar_blocks(organization_id);
create index calendar_blocks_project_id_idx on public.calendar_blocks(project_id);
create index calendar_blocks_task_id_idx on public.calendar_blocks(task_id);
create index calendar_blocks_subtask_id_idx on public.calendar_blocks(subtask_id);
create index calendar_blocks_start_at_idx on public.calendar_blocks(start_at);
create index calendar_blocks_end_at_idx on public.calendar_blocks(end_at);
create index calendar_blocks_deleted_at_idx on public.calendar_blocks(deleted_at);
create index activity_logs_user_id_idx on public.activity_logs(user_id);
create index activity_logs_task_id_idx on public.activity_logs(task_id);
create index activity_logs_calendar_block_id_idx on public.activity_logs(calendar_block_id);
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_related_task_id_idx on public.notifications(related_task_id);
create index notifications_related_calendar_block_id_idx on public.notifications(related_calendar_block_id);
create index user_settings_user_id_idx on public.user_settings(user_id);
create index trash_items_user_id_idx on public.trash_items(user_id);
create index trash_items_permanent_delete_at_idx on public.trash_items(permanent_delete_at);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.project_tags enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.task_links enable row level security;
alter table public.calendar_blocks enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.user_settings enable row level security;
alter table public.trash_items enable row level security;

create policy "profiles select own" on public.profiles for select using (id = auth.uid());
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles delete own" on public.profiles for delete using (id = auth.uid());

create policy "organizations select own" on public.organizations for select using (user_id = auth.uid());
create policy "organizations insert own" on public.organizations for insert with check (user_id = auth.uid());
create policy "organizations update own" on public.organizations for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "organizations delete own" on public.organizations for delete using (user_id = auth.uid());

create policy "projects select own" on public.projects for select using (user_id = auth.uid());
create policy "projects insert own" on public.projects for insert with check (user_id = auth.uid());
create policy "projects update own" on public.projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "projects delete own" on public.projects for delete using (user_id = auth.uid());

create policy "project_tags select own" on public.project_tags for select using (user_id = auth.uid());
create policy "project_tags insert own" on public.project_tags for insert with check (user_id = auth.uid());
create policy "project_tags update own" on public.project_tags for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "project_tags delete own" on public.project_tags for delete using (user_id = auth.uid());

create policy "tasks select own" on public.tasks for select using (user_id = auth.uid());
create policy "tasks insert own" on public.tasks for insert with check (user_id = auth.uid());
create policy "tasks update own" on public.tasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks delete own" on public.tasks for delete using (user_id = auth.uid());

create policy "subtasks select own" on public.subtasks for select using (user_id = auth.uid());
create policy "subtasks insert own" on public.subtasks for insert with check (user_id = auth.uid());
create policy "subtasks update own" on public.subtasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subtasks delete own" on public.subtasks for delete using (user_id = auth.uid());

create policy "task_links select own" on public.task_links for select using (user_id = auth.uid());
create policy "task_links insert own" on public.task_links for insert with check (user_id = auth.uid());
create policy "task_links update own" on public.task_links for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "task_links delete own" on public.task_links for delete using (user_id = auth.uid());

create policy "calendar_blocks select own" on public.calendar_blocks for select using (user_id = auth.uid());
create policy "calendar_blocks insert own" on public.calendar_blocks for insert with check (user_id = auth.uid());
create policy "calendar_blocks update own" on public.calendar_blocks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "calendar_blocks delete own" on public.calendar_blocks for delete using (user_id = auth.uid());

create policy "activity_logs select own" on public.activity_logs for select using (user_id = auth.uid());
create policy "activity_logs insert own" on public.activity_logs for insert with check (user_id = auth.uid());
create policy "activity_logs update own" on public.activity_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "activity_logs delete own" on public.activity_logs for delete using (user_id = auth.uid());

create policy "notifications select own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications insert own" on public.notifications for insert with check (user_id = auth.uid());
create policy "notifications update own" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications delete own" on public.notifications for delete using (user_id = auth.uid());

create policy "user_settings select own" on public.user_settings for select using (user_id = auth.uid());
create policy "user_settings insert own" on public.user_settings for insert with check (user_id = auth.uid());
create policy "user_settings update own" on public.user_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_settings delete own" on public.user_settings for delete using (user_id = auth.uid());

create policy "trash_items select own" on public.trash_items for select using (user_id = auth.uid());
create policy "trash_items insert own" on public.trash_items for insert with check (user_id = auth.uid());
create policy "trash_items update own" on public.trash_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "trash_items delete own" on public.trash_items for delete using (user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
