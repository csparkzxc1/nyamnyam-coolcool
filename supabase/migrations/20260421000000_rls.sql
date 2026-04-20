-- =========================================
-- T103: Row Level Security policies for 냠냠쿨쿨
-- Sharing model: Case 2 (Family sharing via caregivers table)
-- =========================================

-- =========================================
-- 1. Enable RLS on all tables
-- =========================================
alter table public.babies enable row level security;
alter table public.caregivers enable row level security;
alter table public.feeding_records enable row level security;
alter table public.sleep_records enable row level security;
alter table public.diaper_records enable row level security;

-- =========================================
-- 2. Helper function: is_caregiver
-- Checks if the current authenticated user is a caregiver of the given baby
-- SECURITY DEFINER allows bypassing RLS when checking caregivers table
-- =========================================
create or replace function public.is_caregiver(_baby_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.caregivers
    where baby_id = _baby_id
      and user_id = auth.uid()
      and auth.uid() is not null
  );
$$;

-- =========================================
-- 3. Auto-register creator as caregiver (parent role) when a baby is created
-- =========================================
create or replace function public.auto_register_caregiver()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.caregivers (baby_id, user_id, role, permissions)
  values (new.id, new.created_by, 'parent', array['read','write']);
  return new;
end;
$$;

create trigger babies_auto_register_caregiver
  after insert on public.babies
  for each row
  execute function public.auto_register_caregiver();

-- =========================================
-- 4. babies policies
-- =========================================
create policy babies_select_caregivers on public.babies
  for select
  using (public.is_caregiver(id));

create policy babies_insert_authenticated on public.babies
  for insert
  with check (
    auth.uid() is not null
    and created_by = auth.uid()
  );

create policy babies_update_creator on public.babies
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy babies_delete_creator on public.babies
  for delete
  using (created_by = auth.uid());

-- =========================================
-- 5. caregivers policies
-- =========================================
-- 본인이 포함된 caregiver row만 조회 가능 (본인 role 확인, 가족 목록 확인용)
create policy caregivers_select_self on public.caregivers
  for select
  using (user_id = auth.uid());

-- parent 역할의 caregiver만 다른 caregiver 추가 가능 (가족 초대)
create policy caregivers_insert_parent on public.caregivers
  for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.caregivers c
      where c.baby_id = caregivers.baby_id
        and c.user_id = auth.uid()
        and c.role = 'parent'
    )
  );

-- 본인이 parent인 baby의 caregiver만 삭제 가능 (가족 해제)
create policy caregivers_delete_parent on public.caregivers
  for delete
  using (
    exists (
      select 1 from public.caregivers c
      where c.baby_id = caregivers.baby_id
        and c.user_id = auth.uid()
        and c.role = 'parent'
    )
  );

-- =========================================
-- 6. feeding_records policies
-- =========================================
create policy feeding_records_select_caregivers on public.feeding_records
  for select
  using (public.is_caregiver(baby_id));

create policy feeding_records_insert_caregivers on public.feeding_records
  for insert
  with check (
    public.is_caregiver(baby_id)
    and created_by = auth.uid()
  );

create policy feeding_records_update_creator on public.feeding_records
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy feeding_records_delete_creator on public.feeding_records
  for delete
  using (created_by = auth.uid());

-- =========================================
-- 7. sleep_records policies
-- =========================================
create policy sleep_records_select_caregivers on public.sleep_records
  for select
  using (public.is_caregiver(baby_id));

create policy sleep_records_insert_caregivers on public.sleep_records
  for insert
  with check (
    public.is_caregiver(baby_id)
    and created_by = auth.uid()
  );

create policy sleep_records_update_creator on public.sleep_records
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy sleep_records_delete_creator on public.sleep_records
  for delete
  using (created_by = auth.uid());

-- =========================================
-- 8. diaper_records policies
-- =========================================
create policy diaper_records_select_caregivers on public.diaper_records
  for select
  using (public.is_caregiver(baby_id));

create policy diaper_records_insert_caregivers on public.diaper_records
  for insert
  with check (
    public.is_caregiver(baby_id)
    and created_by = auth.uid()
  );

create policy diaper_records_update_creator on public.diaper_records
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy diaper_records_delete_creator on public.diaper_records
  for delete
  using (created_by = auth.uid());
