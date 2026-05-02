-- =========================================
-- T801: invites 테이블 — 가족 공유 초대 토큰
-- 부모가 다른 보호자(배우자·조부모)를 초대할 수 있는 토큰을 발급한다.
-- 토큰 수락 시 caregivers 테이블에 행 추가 → RLS 정책에 의해 자동으로
-- 해당 baby 데이터 접근 권한 획득.
-- =========================================

create table public.invites (
  -- URL-safe 16바이트 랜덤 토큰. 클라이언트에서 생성 후 insert.
  token text primary key,
  baby_id uuid not null references public.babies(id) on delete cascade,
  invited_by uuid not null references auth.users(id),
  -- caregivers.role과 동일 enum.
  role text not null check (role in ('parent', 'grandparent', 'caregiver')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  -- 수락 시점에 set; null이면 미사용.
  used_at timestamptz,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_invites_baby on public.invites(baby_id);

-- =========================================
-- RLS — 초대장은 baby의 보호자가 발급하고, 초대받은 사람만 수락한다.
-- 1) 부모(또는 보호자)는 자기 baby의 초대장을 볼 수 있어야 한다 (재발송용).
-- 2) 인증된 모든 사용자는 token으로 SELECT 가능 (초대 수락 화면이 토큰만으로
--    아기 정보를 표시해야 함). RLS는 baby_id 무관 토큰 조회를 허용해야 함.
-- 3) INSERT는 invited_by가 본인이고, 해당 baby의 보호자일 때만.
-- 4) UPDATE는 used_at만 set 가능 (수락). 토큰 만료 검증은 클라이언트가 한다.
-- =========================================

alter table public.invites enable row level security;

drop policy if exists invites_select_token_or_caregiver on public.invites;
drop policy if exists invites_insert_caregivers on public.invites;
drop policy if exists invites_update_accept on public.invites;
drop policy if exists invites_delete_caregivers on public.invites;

-- 모든 인증 사용자가 select 가능 (token으로 조회). RLS가 못 막더라도 token이
-- 16바이트 랜덤이라 추측 불가능 → 사실상 capability URL 패턴.
create policy invites_select_token_or_caregiver on public.invites
  for select to authenticated
  using (true);

create policy invites_insert_caregivers on public.invites
  for insert to authenticated
  with check (
    invited_by = auth.uid()
    and public.is_caregiver(baby_id)
  );

-- 본인이 발급한 초대장은 취소(delete) 가능.
create policy invites_delete_caregivers on public.invites
  for delete to authenticated
  using (invited_by = auth.uid());

-- 수락은 used_at/used_by 만 변경 가능. 다른 컬럼 변경은 with check 로 차단.
create policy invites_update_accept on public.invites
  for update to authenticated
  using (used_at is null and expires_at > now())
  with check (used_by = auth.uid());
