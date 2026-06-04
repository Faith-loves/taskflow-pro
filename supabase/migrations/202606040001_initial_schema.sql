create extension if not exists "pgcrypto";

create type public.workspace_role as enum ('Owner', 'Admin', 'Member', 'Viewer');
create type public.project_status as enum ('Active', 'Completed', 'Archived');
create type public.task_priority as enum ('Low', 'Medium', 'High', 'Urgent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'Member',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'Member',
  invited_by uuid not null references public.profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  start_date date,
  due_date date,
  status public.project_status not null default 'Active',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (project_id, user_id)
);

create table public.board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  column_id uuid not null references public.board_columns(id) on delete restrict,
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id) on delete set null,
  priority public.task_priority not null default 'Medium',
  due_date date,
  labels text[] not null default '{}',
  position int not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  position int not null default 0
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create table public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles(email);
create index workspace_members_user_idx on public.workspace_members(user_id);
create index projects_workspace_status_idx on public.projects(workspace_id, status);
create index board_columns_project_position_idx on public.board_columns(project_id, position);
create index tasks_project_column_position_idx on public.tasks(project_id, column_id, position);
create index tasks_assignee_due_idx on public.tasks(assignee_id, due_date);
create index task_comments_task_created_idx on public.task_comments(task_id, created_at desc);
create index task_activity_task_created_idx on public.task_activity(task_id, created_at desc);
create index notifications_user_read_idx on public.notifications(user_id, read, created_at desc);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.board_columns enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_activity enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed public.workspace_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid() and role = any(allowed)
  );
$$;

create policy "Users can view their own profile" on public.profiles for select using (id = auth.uid());
create policy "Users can update their own profile" on public.profiles for update using (id = auth.uid());
create policy "Users can insert their own profile" on public.profiles for insert with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.seed_workspace_demo_data(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  owner_user_id uuid;
  target_project_id uuid;
  backlog_col uuid;
  todo_col uuid;
  progress_col uuid;
  review_col uuid;
  done_col uuid;
  task_brief uuid;
  task_onboarding uuid;
  task_meeting uuid;
  task_copy uuid;
  task_qa uuid;
  task_launch uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'Not a workspace member';
  end if;

  select owner_id into owner_user_id
  from public.workspaces
  where id = target_workspace_id;

  select p.id into target_project_id
  from public.projects p
  where p.workspace_id = target_workspace_id
  order by p.created_at asc
  limit 1;

  if target_project_id is null then
    insert into public.projects (workspace_id, title, description, start_date, due_date, created_by)
    values (
      target_workspace_id,
      'Website Redesign',
      'Refresh the customer-facing website, onboarding flow, launch copy, and analytics dashboard.',
      current_date - 7,
      current_date + 21,
      owner_user_id
    )
    returning id into target_project_id;

    insert into public.project_members (project_id, user_id)
    values (target_project_id, owner_user_id)
    on conflict do nothing;
  end if;

  if exists (select 1 from public.tasks where project_id = target_project_id) then
    return;
  end if;

  insert into public.workspace_invitations (workspace_id, email, role, invited_by)
  values
    (target_workspace_id, 'sarah.design@example.com', 'Admin', owner_user_id),
    (target_workspace_id, 'jamal.engineering@example.com', 'Member', owner_user_id),
    (target_workspace_id, 'olivia.client@example.com', 'Viewer', owner_user_id)
  on conflict do nothing;

  update public.projects
  set
    title = 'Website Redesign',
    description = 'Refresh the customer-facing website, onboarding flow, launch copy, and analytics dashboard.',
    start_date = current_date - 7,
    due_date = current_date + 21,
    status = 'Active'
  where id = target_project_id;

  select id into backlog_col from public.board_columns where project_id = target_project_id and title = 'Backlog' limit 1;
  select id into todo_col from public.board_columns where project_id = target_project_id and title = 'To Do' limit 1;
  select id into progress_col from public.board_columns where project_id = target_project_id and title = 'In Progress' limit 1;
  select id into review_col from public.board_columns where project_id = target_project_id and title = 'In Review' limit 1;
  select id into done_col from public.board_columns where project_id = target_project_id and title = 'Done' limit 1;

  if backlog_col is null then insert into public.board_columns (project_id, title, position) values (target_project_id, 'Backlog', 0) returning id into backlog_col; end if;
  if todo_col is null then insert into public.board_columns (project_id, title, position) values (target_project_id, 'To Do', 1) returning id into todo_col; end if;
  if progress_col is null then insert into public.board_columns (project_id, title, position) values (target_project_id, 'In Progress', 2) returning id into progress_col; end if;
  if review_col is null then insert into public.board_columns (project_id, title, position) values (target_project_id, 'In Review', 3) returning id into review_col; end if;
  if done_col is null then insert into public.board_columns (project_id, title, position) values (target_project_id, 'Done', 4) returning id into done_col; end if;

  insert into public.tasks (project_id, column_id, title, description, assignee_id, priority, due_date, labels, position, created_by)
  values (
    target_project_id,
    backlog_col,
    'Prepare stakeholder kickoff brief',
    'Collect goals, launch constraints, decision makers, and open questions for the Monday kickoff meeting at 10:00 AM.',
    owner_user_id,
    'High',
    current_date + 1,
    array['Meeting','Planning'],
    0,
    owner_user_id
  )
  returning id into task_brief;

  insert into public.tasks (project_id, column_id, title, description, assignee_id, priority, due_date, labels, position, created_by)
  values (
    target_project_id,
    progress_col,
    'Design onboarding screen',
    'Create the first-run onboarding flow for new workspace owners, including empty states and invite prompts.',
    owner_user_id,
    'High',
    current_date + 4,
    array['Design','Onboarding'],
    0,
    owner_user_id
  )
  returning id into task_onboarding;

  insert into public.tasks (project_id, column_id, title, description, assignee_id, priority, due_date, labels, position, created_by)
  values (
    target_project_id,
    todo_col,
    'Schedule design review with Sarah and Jamal',
    'Book a 30-minute review for homepage sections, API handoff, and responsive edge cases.',
    owner_user_id,
    'Medium',
    current_date + 2,
    array['Meeting','Review'],
    0,
    owner_user_id
  )
  returning id into task_meeting;

  insert into public.tasks (project_id, column_id, title, description, assignee_id, priority, due_date, labels, position, created_by)
  values (
    target_project_id,
    review_col,
    'Finalize landing page copy',
    'Review hero message, feature language, proof points, and conversion CTA before handoff.',
    owner_user_id,
    'Medium',
    current_date + 3,
    array['Copy','Marketing'],
    0,
    owner_user_id
  )
  returning id into task_copy;

  insert into public.tasks (project_id, column_id, title, description, assignee_id, priority, due_date, labels, position, created_by)
  values (
    target_project_id,
    done_col,
    'QA responsive board layout',
    'Verify desktop, tablet, and mobile board behavior with detail drawer open and closed.',
    owner_user_id,
    'Medium',
    current_date - 1,
    array['QA','Responsive'],
    0,
    owner_user_id
  )
  returning id into task_qa;

  insert into public.tasks (project_id, column_id, title, description, assignee_id, priority, due_date, labels, position, created_by)
  values (
    target_project_id,
    todo_col,
    'Create launch checklist for Friday',
    'Confirm assets, analytics events, sign-off owners, deployment window, and rollback plan.',
    owner_user_id,
    'Urgent',
    current_date + 5,
    array['Launch','Ops'],
    1,
    owner_user_id
  )
  returning id into task_launch;

  insert into public.subtasks (task_id, title, completed, position)
  values
    (task_brief, 'Write agenda for kickoff meeting', true, 0),
    (task_brief, 'List blockers and decisions needed', false, 1),
    (task_onboarding, 'Sketch invite teammate empty state', true, 0),
    (task_onboarding, 'Prepare mobile version', false, 1),
    (task_meeting, 'Send calendar hold for 2:30 PM', false, 0),
    (task_launch, 'Confirm production checklist owner', false, 0),
    (task_launch, 'Add analytics validation tasks', false, 1);

  insert into public.task_comments (task_id, author_id, body)
  values
    (task_brief, owner_user_id, '@Sarah please add the brand goals before the kickoff meeting.'),
    (task_onboarding, owner_user_id, '@Jamal I updated the onboarding notes. Please check engineering handoff.'),
    (task_meeting, owner_user_id, 'Design review is planned for 2:30 PM tomorrow. Bring mobile screenshots.'),
    (task_copy, owner_user_id, '@Olivia please review the pricing CTA before final approval.');

  insert into public.task_activity (task_id, actor_id, action)
  values
    (task_brief, owner_user_id, 'created kickoff planning task.'),
    (task_onboarding, owner_user_id, 'moved this task from To Do to In Progress.'),
    (task_meeting, owner_user_id, 'scheduled a design review meeting.'),
    (task_copy, owner_user_id, 'added copy review notes.'),
    (task_qa, owner_user_id, 'completed responsive QA.'),
    (task_launch, owner_user_id, 'marked launch checklist as urgent.');

  insert into public.notifications (user_id, title, body, type)
  values
    (owner_user_id, 'Design review tomorrow', 'Review homepage sections with Sarah and Jamal at 2:30 PM.', 'deadline'),
    (owner_user_id, 'You were mentioned', 'Sarah was mentioned in the kickoff brief task.', 'mention'),
    (owner_user_id, 'Launch task is urgent', 'Create launch checklist for Friday needs attention.', 'assignment');
end;
$$;

grant execute on function public.seed_workspace_demo_data(uuid) to authenticated;

create or replace function public.create_initial_workspace(workspace_name text default 'My TaskFlow Workspace', user_email text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_workspace_id uuid;
  new_project_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select workspace_id into new_workspace_id
  from public.workspace_members
  where user_id = current_user_id
  limit 1;

  if new_workspace_id is not null then
    return new_workspace_id;
  end if;

  insert into public.profiles (id, email, full_name, title)
  values (
    current_user_id,
    coalesce(user_email, current_user_id::text),
    split_part(coalesce(user_email, 'New user'), '@', 1),
    'Workspace owner'
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email);

  insert into public.workspaces (name, owner_id)
  values (workspace_name, current_user_id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, current_user_id, 'Owner');

  insert into public.projects (workspace_id, title, description, start_date, due_date, created_by)
  values (
    new_workspace_id,
    'Website Redesign',
    'Your first real project in TaskFlow Pro.',
    current_date,
    current_date + 21,
    current_user_id
  )
  returning id into new_project_id;

  insert into public.project_members (project_id, user_id)
  values (new_project_id, current_user_id);

  insert into public.board_columns (project_id, title, position)
  values
    (new_project_id, 'Backlog', 0),
    (new_project_id, 'To Do', 1),
    (new_project_id, 'In Progress', 2),
    (new_project_id, 'In Review', 3),
    (new_project_id, 'Done', 4);

  perform public.seed_workspace_demo_data(new_workspace_id);

  return new_workspace_id;
end;
$$;

grant execute on function public.create_initial_workspace(text, text) to authenticated;

create policy "Workspace members can view workspaces" on public.workspaces for select using (public.is_workspace_member(id));
create policy "Authenticated users can create own workspace" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners and admins can update workspaces" on public.workspaces for update using (public.has_workspace_role(id, array['Owner','Admin']::public.workspace_role[]));
create policy "Owners can delete workspaces" on public.workspaces for delete using (public.has_workspace_role(id, array['Owner']::public.workspace_role[]));

create policy "Members can view workspace members" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "Owners and admins manage members" on public.workspace_members for all using (public.has_workspace_role(workspace_id, array['Owner','Admin']::public.workspace_role[]));
create policy "Workspace creator can add self as owner" on public.workspace_members for insert to authenticated with check (
  user_id = auth.uid()
  and role = 'Owner'
  and exists (
    select 1 from public.workspaces
    where workspaces.id = workspace_members.workspace_id
      and workspaces.owner_id = auth.uid()
  )
);

create policy "Members can view invitations" on public.workspace_invitations for select using (public.is_workspace_member(workspace_id));
create policy "Owners and admins invite" on public.workspace_invitations for insert with check (public.has_workspace_role(workspace_id, array['Owner','Admin']::public.workspace_role[]));

create policy "Members can view projects" on public.projects for select using (public.is_workspace_member(workspace_id));
create policy "Admins can create projects" on public.projects for insert with check (public.has_workspace_role(workspace_id, array['Owner','Admin']::public.workspace_role[]));
create policy "Admins can update projects" on public.projects for update using (public.has_workspace_role(workspace_id, array['Owner','Admin']::public.workspace_role[]));
create policy "Admins can delete projects" on public.projects for delete using (public.has_workspace_role(workspace_id, array['Owner','Admin']::public.workspace_role[]));

create policy "Members can view project members" on public.project_members for select using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id))
);
create policy "Admins can manage project members" on public.project_members for all using (
  exists (select 1 from public.projects p where p.id = project_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin']::public.workspace_role[]))
);

create policy "Members can view board columns" on public.board_columns for select using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id))
);
create policy "Members can edit board columns" on public.board_columns for all using (
  exists (select 1 from public.projects p where p.id = project_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin','Member']::public.workspace_role[]))
);

create policy "Members can view tasks" on public.tasks for select using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id))
);
create policy "Members can create tasks" on public.tasks for insert with check (
  exists (select 1 from public.projects p where p.id = project_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin','Member']::public.workspace_role[]))
);
create policy "Members can update tasks" on public.tasks for update using (
  exists (select 1 from public.projects p where p.id = project_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin','Member']::public.workspace_role[]))
);
create policy "Members can delete tasks" on public.tasks for delete using (
  exists (select 1 from public.projects p where p.id = project_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin','Member']::public.workspace_role[]))
);

create policy "Task children readable by workspace members" on public.subtasks for select using (
  exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_id and public.is_workspace_member(p.workspace_id))
);
create policy "Task children editable by members" on public.subtasks for all using (
  exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin','Member']::public.workspace_role[]))
);

create policy "Comments readable by workspace members" on public.task_comments for select using (
  exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_id and public.is_workspace_member(p.workspace_id))
);
create policy "Members can comment" on public.task_comments for insert with check (
  author_id = auth.uid() and exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin','Member']::public.workspace_role[]))
);
create policy "Users can edit own comments" on public.task_comments for update using (author_id = auth.uid());
create policy "Users can delete own comments" on public.task_comments for delete using (author_id = auth.uid());

create policy "Attachments readable by workspace members" on public.task_attachments for select using (
  exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_id and public.is_workspace_member(p.workspace_id))
);
create policy "Members can add attachments" on public.task_attachments for insert with check (uploaded_by = auth.uid());
create policy "Members can delete attachments" on public.task_attachments for delete using (
  uploaded_by = auth.uid() or exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin']::public.workspace_role[]))
);

create policy "Activity readable by workspace members" on public.task_activity for select using (
  exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_id and public.is_workspace_member(p.workspace_id))
);
create policy "Members can add activity" on public.task_activity for insert with check (actor_id = auth.uid());

create policy "Users can view own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users can update own notifications" on public.notifications for update using (user_id = auth.uid());
create policy "Users can delete own notifications" on public.notifications for delete using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', true),
       ('profile-avatars', 'profile-avatars', true),
       ('workspace-logos', 'workspace-logos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload task attachments"
on storage.objects for insert to authenticated
with check (bucket_id = 'task-attachments');

create policy "Authenticated users can read task attachments"
on storage.objects for select to authenticated
using (bucket_id = 'task-attachments');

create policy "Authenticated users can delete task attachments"
on storage.objects for delete to authenticated
using (bucket_id = 'task-attachments');

create policy "Authenticated users can upload profile avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-avatars');

create policy "Anyone can read profile avatars"
on storage.objects for select
using (bucket_id = 'profile-avatars');

create policy "Authenticated users can upload workspace logos"
on storage.objects for insert to authenticated
with check (bucket_id = 'workspace-logos');

create policy "Anyone can read workspace logos"
on storage.objects for select
using (bucket_id = 'workspace-logos');

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.task_comments;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.task_activity;
