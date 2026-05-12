-- =========================================
-- TaskFlow - Supabase Schema
-- Supabase Dashboard > SQL Editor に貼って実行
-- =========================================

-- 1) Extensions
create extension if not exists pgcrypto;

-- 2) Enums
do $$ begin
  create type public.project_role as enum ('owner', 'admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('todo', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

-- 3) Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#3B82F6',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.project_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  assignee_id uuid references auth.users(id) on delete set null,
  due_date date,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  created_at timestamptz not null default now()
);

create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role public.project_role not null default 'member',
  invited_by uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint project_invites_email_check check (position('@' in email) > 1)
);

-- 4) Indexes
create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_assignee_id on public.tasks(assignee_id);
create index if not exists idx_project_invites_project_id on public.project_invites(project_id);
create index if not exists idx_project_invites_email on public.project_invites(email);
create index if not exists idx_project_invites_token on public.project_invites(token);

-- 5) Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 6) Auto-add owner as member
create or replace function public.add_owner_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_members(project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_project_created_add_owner on public.projects;
create trigger on_project_created_add_owner
after insert on public.projects
for each row execute procedure public.add_owner_membership();

-- 7) Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.project_invites enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- メンバーが互いのprofileを参照できるようにする
drop policy if exists "profiles_select_member" on public.profiles;
create policy "profiles_select_member" on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.project_members pm1
      join public.project_members pm2 on pm1.project_id = pm2.project_id
      where pm1.user_id = auth.uid() and pm2.user_id = profiles.id
    )
  );

-- projects
drop policy if exists "projects_select_member" on public.projects;
create policy "projects_select_member" on public.projects for select to authenticated
  using (exists (select 1 from public.project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid()));

drop policy if exists "projects_insert_owner" on public.projects;
create policy "projects_insert_owner" on public.projects for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "projects_update_owner" on public.projects;
create policy "projects_update_owner" on public.projects for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "projects_delete_owner" on public.projects;
create policy "projects_delete_owner" on public.projects for delete to authenticated
  using (owner_id = auth.uid());

-- project_members
drop policy if exists "pm_select_member" on public.project_members;
create policy "pm_select_member" on public.project_members for select to authenticated
  using (exists (select 1 from public.project_members pm2 where pm2.project_id = project_members.project_id and pm2.user_id = auth.uid()));

drop policy if exists "pm_insert_admin" on public.project_members;
create policy "pm_insert_admin" on public.project_members for insert to authenticated
  with check (exists (select 1 from public.project_members me where me.project_id = project_members.project_id and me.user_id = auth.uid() and me.role in ('owner','admin')));

drop policy if exists "pm_delete_admin" on public.project_members;
create policy "pm_delete_admin" on public.project_members for delete to authenticated
  using (exists (select 1 from public.project_members me where me.project_id = project_members.project_id and me.user_id = auth.uid() and me.role in ('owner','admin')));

-- tasks
drop policy if exists "tasks_select_member" on public.tasks;
create policy "tasks_select_member" on public.tasks for select to authenticated
  using (exists (select 1 from public.project_members pm where pm.project_id = tasks.project_id and pm.user_id = auth.uid()));

drop policy if exists "tasks_insert_member" on public.tasks;
create policy "tasks_insert_member" on public.tasks for insert to authenticated
  with check (exists (select 1 from public.project_members pm where pm.project_id = tasks.project_id and pm.user_id = auth.uid()));

drop policy if exists "tasks_update_member" on public.tasks;
create policy "tasks_update_member" on public.tasks for update to authenticated
  using (exists (select 1 from public.project_members pm where pm.project_id = tasks.project_id and pm.user_id = auth.uid()))
  with check (exists (select 1 from public.project_members pm where pm.project_id = tasks.project_id and pm.user_id = auth.uid()));

drop policy if exists "tasks_delete_member" on public.tasks;
create policy "tasks_delete_member" on public.tasks for delete to authenticated
  using (exists (select 1 from public.project_members pm where pm.project_id = tasks.project_id and pm.user_id = auth.uid()));

-- project_invites
drop policy if exists "invites_select_member" on public.project_invites;
create policy "invites_select_member" on public.project_invites for select to authenticated
  using (exists (select 1 from public.project_members pm where pm.project_id = project_invites.project_id and pm.user_id = auth.uid()));

drop policy if exists "invites_insert_admin" on public.project_invites;
create policy "invites_insert_admin" on public.project_invites for insert to authenticated
  with check (
    exists (select 1 from public.project_members me where me.project_id = project_invites.project_id and me.user_id = auth.uid() and me.role in ('owner','admin'))
    and invited_by = auth.uid()
  );

drop policy if exists "invites_delete_admin" on public.project_invites;
create policy "invites_delete_admin" on public.project_invites for delete to authenticated
  using (exists (select 1 from public.project_members me where me.project_id = project_invites.project_id and me.user_id = auth.uid() and me.role in ('owner','admin')));

drop policy if exists "invites_update_accept_self_email" on public.project_invites;
create policy "invites_update_accept_self_email" on public.project_invites for update to authenticated
  using (accepted_at is null and lower(email) = lower((auth.jwt() ->> 'email')))
  with check (accepted_at is not null and lower(email) = lower((auth.jwt() ->> 'email')));

-- 8) Realtime
-- REPLICA IDENTITY FULL = UPDATE時に変更前後の全カラムを含むペイロードを配信
alter table public.tasks replica identity full;
alter table public.projects replica identity full;
alter table public.project_members replica identity full;

-- supabase_realtime publication にテーブルを登録
-- （これをしないとRealtimeがDB変更をブロードキャストしない）
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.project_members;
