-- =========================================
-- TaskFlow - 機能追加マイグレーション
-- 1. tasks テーブルに notes, parent_task_id を追加
-- 2. feedbacks テーブル（Proユーザーのみ）
-- 3. standups テーブル（デイリースタンドアップ）
-- Supabase Dashboard > SQL Editor に貼って実行
-- =========================================

-- -----------------------------------------------
-- 1) tasks テーブルへのカラム追加
-- -----------------------------------------------
alter table public.tasks
  add column if not exists notes text,
  add column if not exists parent_task_id uuid references public.tasks(id) on delete set null;

create index if not exists idx_tasks_parent_task_id on public.tasks(parent_task_id);

-- Realtime に追加済みなので再設定不要

-- -----------------------------------------------
-- 2) feedbacks テーブル（Proユーザー向けフィードバック）
-- -----------------------------------------------
create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'general',
  content text not null,
  rating int check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now()
);

create index if not exists idx_feedbacks_user_id on public.feedbacks(user_id);

alter table public.feedbacks enable row level security;

drop policy if exists "feedbacks_select_own" on public.feedbacks;
create policy "feedbacks_select_own" on public.feedbacks for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "feedbacks_insert_own" on public.feedbacks;
create policy "feedbacks_insert_own" on public.feedbacks for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "feedbacks_delete_own" on public.feedbacks;
create policy "feedbacks_delete_own" on public.feedbacks for delete to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------
-- 3) standups テーブル（デイリースタンドアップ）
-- -----------------------------------------------
create table if not exists public.standups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  standup_date date not null default current_date,
  yesterday text,
  today text not null,
  blockers text,
  created_at timestamptz not null default now(),
  unique (project_id, user_id, standup_date)
);

create index if not exists idx_standups_project_id on public.standups(project_id);
create index if not exists idx_standups_user_id on public.standups(user_id);
create index if not exists idx_standups_date on public.standups(standup_date);

alter table public.standups enable row level security;

-- プロジェクトメンバーはスタンドアップを参照できる
drop policy if exists "standups_select_member" on public.standups;
create policy "standups_select_member" on public.standups for select to authenticated
  using (exists (
    select 1 from public.project_members pm
    where pm.project_id = standups.project_id and pm.user_id = auth.uid()
  ));

-- プロジェクトメンバーは自分のスタンドアップを投稿できる
drop policy if exists "standups_insert_own" on public.standups;
create policy "standups_insert_own" on public.standups for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = standups.project_id and pm.user_id = auth.uid()
    )
  );

-- 自分のスタンドアップのみ更新可能
drop policy if exists "standups_update_own" on public.standups;
create policy "standups_update_own" on public.standups for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 自分のスタンドアップのみ削除可能
drop policy if exists "standups_delete_own" on public.standups;
create policy "standups_delete_own" on public.standups for delete to authenticated
  using (user_id = auth.uid());

-- Realtime
alter table public.standups replica identity full;
alter publication supabase_realtime add table public.standups;
