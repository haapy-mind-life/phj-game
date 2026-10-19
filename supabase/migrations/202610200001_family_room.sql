-- Run in a dedicated Supabase project's SQL Editor as its administrator.
-- Gameplay saves are not stored here. Enrollment is administrator-only.
begin;
create table if not exists public.family_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null,
  nickname text not null check (nickname in ('현준', '아빠', '엄마', '누나')),
  unique (family_id, nickname)
);
alter table public.family_members enable row level security;
revoke all on public.family_members from anon, authenticated;
grant select on public.family_members to authenticated;
drop policy if exists "family_member_reads_self" on public.family_members;
create policy "family_member_reads_self" on public.family_members
  for select to authenticated using (user_id = (select auth.uid()));

-- realtime.messages already has RLS enabled in Supabase. Do not ALTER it.
drop policy if exists "family_receives_private" on realtime.messages;
create policy "family_receives_private" on realtime.messages
for select to authenticated using (
  realtime.messages.extension in ('broadcast', 'presence')
  and (select realtime.topic()) ~ '^family:[0-9a-f-]{36}:[A-HJ-NP-Z2-9]{6}$'
  and exists (
    select 1 from public.family_members
    where user_id = (select auth.uid())
      and family_id::text = split_part((select realtime.topic()), ':', 2)
  )
);
drop policy if exists "family_sends_private" on realtime.messages;
create policy "family_sends_private" on realtime.messages
for insert to authenticated with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and (select realtime.topic()) ~ '^family:[0-9a-f-]{36}:[A-HJ-NP-Z2-9]{6}$'
  and exists (
    select 1 from public.family_members
    where user_id = (select auth.uid())
      and family_id::text = split_part((select realtime.topic()), ':', 2)
  )
);
commit;
