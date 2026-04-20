-- =========================================
-- T102: Initial schema for 냠냠쿨쿨
-- Tables: babies, caregivers, feeding_records, sleep_records, diaper_records
-- NOTE: RLS policies will be added in T103
-- =========================================

-- babies: 아기 정보 (1 baby = N caregivers)
create table public.babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  gender char(1) check (gender in ('M','F')),
  weight_kg numeric(4,2),
  feeding_type text not null check (feeding_type in ('breast','formula','mixed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- caregivers: 가족 공유용 조인 테이블 (Case 2: 가족 공유 모델)
create table public.caregivers (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('parent','grandparent','caregiver')),
  permissions text[] not null default array['read','write'],
  created_at timestamptz not null default now(),
  unique (baby_id, user_id)
);

-- feeding_records: 수유 기록 (end_at null 허용 = 수유 중)
create table public.feeding_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  type text not null check (type in ('breast_left','breast_right','formula','solid')),
  start_at timestamptz not null,
  end_at timestamptz,
  amount_ml numeric(5,1),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- sleep_records: 수면 기록 (end_at null = 진행 중)
create table public.sleep_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  type text not null check (type in ('nap','night')),
  start_at timestamptz not null,
  end_at timestamptz,
  quality smallint check (quality between 1 and 5),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- diaper_records: 기저귀 기록
create table public.diaper_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  type text not null check (type in ('wet','dirty','both')),
  color text,
  at timestamptz not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- 조회 성능 인덱스
create index idx_feeding_baby_start on public.feeding_records(baby_id, start_at desc);
create index idx_sleep_baby_start on public.sleep_records(baby_id, start_at desc);
create index idx_diaper_baby_at on public.diaper_records(baby_id, at desc);
create index idx_caregivers_user on public.caregivers(user_id);

-- updated_at 자동 갱신 트리거 함수
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- babies 테이블에 updated_at 자동 갱신 트리거 적용
create trigger babies_set_updated_at
  before update on public.babies
  for each row
  execute function public.set_updated_at();
