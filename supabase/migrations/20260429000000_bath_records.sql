-- =========================================
-- T501-1A: bath_records 테이블 추가
-- diaper_records 패턴 카피 (point-in-time 이벤트)
-- type 컬럼은 의도적으로 생략 — 신생아 단계에서 목욕 종류 구분 가치 낮음.
-- 추후 필요시 alter table 로 추가 (마이그레이션 5분).
-- =========================================

-- bath_records: 목욕 기록
create table public.bath_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  at timestamptz not null,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- 조회 성능 인덱스 (diaper 패턴과 동일)
create index idx_bath_baby_at on public.bath_records(baby_id, at desc);

-- =========================================
-- RLS: diaper_records 정책 패턴 100% 카피
-- =========================================

alter table public.bath_records enable row level security;

drop policy if exists bath_records_select_caregivers on public.bath_records;
drop policy if exists bath_records_insert_caregivers on public.bath_records;
drop policy if exists bath_records_update_creator on public.bath_records;
drop policy if exists bath_records_delete_creator on public.bath_records;

create policy bath_records_select_caregivers on public.bath_records
  for select to authenticated
  using (public.is_caregiver(baby_id));

create policy bath_records_insert_caregivers on public.bath_records
  for insert to authenticated
  with check (
    public.is_caregiver(baby_id)
    and created_by = auth.uid()
  );

create policy bath_records_update_creator on public.bath_records
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy bath_records_delete_creator on public.bath_records
  for delete to authenticated
  using (created_by = auth.uid());
