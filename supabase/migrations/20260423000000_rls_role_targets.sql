-- =========================================
-- T103b: Fix RLS policies for first-baby onboarding
--
-- Two issues were discovered during real-device onboarding (2026-04-23):
--
-- 1) Two policies were created without an explicit `to authenticated` clause.
--    They defaulted to role `{public}`, which can behave inconsistently on
--    Supabase. Rewritten to target `authenticated` explicitly.
--
-- 2) `.insert(payload).select().single()` in the client triggered the SELECT
--    policy (`babies_select_caregivers`, using `is_caregiver(id)`) at
--    RETURNING time — but the caregiver row is created by an AFTER INSERT
--    trigger. Because the trigger has not yet committed when the SELECT
--    policy is evaluated, `is_caregiver(id)` returned false and the whole
--    statement failed with 42501.
--
--    The DB side of the fix is to keep the SELECT policy conservative and
--    document this precisely. The client side (src/features/babies/api.ts)
--    was changed to issue INSERT and SELECT as separate requests, so the
--    trigger completes before the follow-up SELECT runs. See docblock on
--    `createBaby()` for details.
--
-- The original rls.sql (20260421000000_rls.sql) is left untouched to
-- preserve history; this migration supersedes the affected policies.
-- =========================================

-- -----------------------------------------
-- caregivers: re-create policies with explicit `to authenticated`
-- -----------------------------------------
drop policy if exists caregivers_select_self on public.caregivers;

create policy caregivers_select_self on public.caregivers
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists caregivers_delete_parent on public.caregivers;

create policy caregivers_delete_parent on public.caregivers
  for delete to authenticated
  using (
    exists (
      select 1 from public.caregivers c
      where c.baby_id = caregivers.baby_id
        and c.user_id = auth.uid()
        and c.role = 'parent'
    )
  );

-- -----------------------------------------
-- caregivers_insert_parent: re-create with explicit `to authenticated`
-- (original condition kept — the AFTER INSERT trigger bypasses this via
-- SECURITY DEFINER, so the strict "already a parent" check stays in place
-- for direct client inserts in the future, e.g. invite-family flows.)
-- -----------------------------------------
drop policy if exists caregivers_insert_parent on public.caregivers;

create policy caregivers_insert_parent on public.caregivers
  for insert to authenticated
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.caregivers c
      where c.baby_id = caregivers.baby_id
        and c.user_id = auth.uid()
        and c.role = 'parent'
    )
  );

-- -----------------------------------------
-- babies: re-create all policies with explicit `to authenticated`.
-- Conditions are identical to 20260421000000_rls.sql; only the role
-- target is made explicit.
-- -----------------------------------------
drop policy if exists babies_select_caregivers on public.babies;

create policy babies_select_caregivers on public.babies
  for select to authenticated
  using (public.is_caregiver(id));

drop policy if exists babies_insert_authenticated on public.babies;

create policy babies_insert_authenticated on public.babies
  for insert to authenticated
  with check (
    auth.uid() is not null
    and created_by = auth.uid()
  );

drop policy if exists babies_update_creator on public.babies;

create policy babies_update_creator on public.babies
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists babies_delete_creator on public.babies;

create policy babies_delete_creator on public.babies
  for delete to authenticated
  using (created_by = auth.uid());

-- -----------------------------------------
-- feeding_records, sleep_records, diaper_records: same treatment
-- -----------------------------------------
drop policy if exists feeding_records_select_caregivers on public.feeding_records;
drop policy if exists feeding_records_insert_caregivers on public.feeding_records;
drop policy if exists feeding_records_update_creator on public.feeding_records;
drop policy if exists feeding_records_delete_creator on public.feeding_records;

create policy feeding_records_select_caregivers on public.feeding_records
  for select to authenticated
  using (public.is_caregiver(baby_id));

create policy feeding_records_insert_caregivers on public.feeding_records
  for insert to authenticated
  with check (
    public.is_caregiver(baby_id)
    and created_by = auth.uid()
  );

create policy feeding_records_update_creator on public.feeding_records
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy feeding_records_delete_creator on public.feeding_records
  for delete to authenticated
  using (created_by = auth.uid());

drop policy if exists sleep_records_select_caregivers on public.sleep_records;
drop policy if exists sleep_records_insert_caregivers on public.sleep_records;
drop policy if exists sleep_records_update_creator on public.sleep_records;
drop policy if exists sleep_records_delete_creator on public.sleep_records;

create policy sleep_records_select_caregivers on public.sleep_records
  for select to authenticated
  using (public.is_caregiver(baby_id));

create policy sleep_records_insert_caregivers on public.sleep_records
  for insert to authenticated
  with check (
    public.is_caregiver(baby_id)
    and created_by = auth.uid()
  );

create policy sleep_records_update_creator on public.sleep_records
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy sleep_records_delete_creator on public.sleep_records
  for delete to authenticated
  using (created_by = auth.uid());

drop policy if exists diaper_records_select_caregivers on public.diaper_records;
drop policy if exists diaper_records_insert_caregivers on public.diaper_records;
drop policy if exists diaper_records_update_creator on public.diaper_records;
drop policy if exists diaper_records_delete_creator on public.diaper_records;

create policy diaper_records_select_caregivers on public.diaper_records
  for select to authenticated
  using (public.is_caregiver(baby_id));

create policy diaper_records_insert_caregivers on public.diaper_records
  for insert to authenticated
  with check (
    public.is_caregiver(baby_id)
    and created_by = auth.uid()
  );

create policy diaper_records_update_creator on public.diaper_records
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy diaper_records_delete_creator on public.diaper_records
  for delete to authenticated
  using (created_by = auth.uid());
