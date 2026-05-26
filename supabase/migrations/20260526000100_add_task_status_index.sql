alter table public.tasks
  add column if not exists status_index smallint not null default 0
  check (status_index between 0 and 4);

create or replace function public.set_task_status_index()
returns trigger
language plpgsql
as $$
begin
  new.status_index = case new.status
    when 'not_started' then 0
    when 'in_progress' then 1
    when 'review' then 2
    when 'blocked' then 3
    when 'waiting' then 3
    when 'done' then 4
    else 0
  end;

  return new;
end;
$$;

drop trigger if exists sync_task_status_index on public.tasks;

create trigger sync_task_status_index
before insert or update of status on public.tasks
for each row
execute function public.set_task_status_index();

update public.tasks
set status_index = case status
  when 'not_started' then 0
  when 'in_progress' then 1
  when 'review' then 2
  when 'blocked' then 3
  when 'waiting' then 3
  when 'done' then 4
  else 0
end;

create index if not exists idx_tasks_user_status_index
  on public.tasks(user_id, status_index)
  where deleted_at is null;

comment on column public.tasks.status_index is
  'Hidden Kanban block index: 0 not_started, 1 in_progress, 2 review, 3 blocked/waiting, 4 done.';
