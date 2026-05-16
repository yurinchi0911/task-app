-- Stripe連携用カラムを profiles に追加
alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_status text not null default 'free';

-- インデックス
create index if not exists idx_profiles_stripe_customer_id
  on public.profiles(stripe_customer_id);
