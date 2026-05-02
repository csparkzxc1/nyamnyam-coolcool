-- =========================================
-- T704: growth_records 테이블 추가
-- 키·몸무게·머리둘레 기록 — 가이드 탭의 성장곡선 차트 (WHO 표준 비교)
-- =========================================

create table public.growth_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  measured_at timestamptz not null,
  -- All three metrics optional — caregivers often record one at a time
  -- (e.g., 4-month checkup might log weight only, weighing-at-home is
  -- more frequent than measuring height).
  height_cm numeric(5,2),
  weight_kg numeric(4,2),
  head_circumference_cm numeric(4,2),
  -- 데이터 무결성: 적어도 하나의 측정값은 있어야 함.
  constraint growth_records_at_least_one_metric
    check (height_cm is not null or weight_kg is not null or head_circumference_cm is not null),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- 조회 성능 인덱스: 차트는 baby 별 시간순 스캔이 주 쿼리.
create index idx_growth_baby_measured_at
  on public.growth_records(baby_id, measured_at desc);

-- =========================================
-- RLS: 다른 기록 테이블과 동일한 caregivers 기반 정책
-- =========================================

alter table public.growth_records enable row level security;

drop policy if exists growth_records_select_caregivers on public.growth_records;
drop policy if exists growth_records_insert_caregivers on public.growth_records;
drop policy if exists growth_records_update_creator on public.growth_records;
drop policy if exists growth_records_delete_creator on public.growth_records;

create policy growth_records_select_caregivers on public.growth_records
  for select to authenticated
  using (public.is_caregiver(baby_id));

create policy growth_records_insert_caregivers on public.growth_records
  for insert to authenticated
  with check (
    public.is_caregiver(baby_id)
    and created_by = auth.uid()
  );

create policy growth_records_update_creator on public.growth_records
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy growth_records_delete_creator on public.growth_records
  for delete to authenticated
  using (created_by = auth.uid());
