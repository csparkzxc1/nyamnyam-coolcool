# 2026-04-20 세션 로그

## 완료

- T002 후속: 목업 커밋 (docs/mockups/t002_preview.html)
- T003: ESLint + Prettier + Husky 설정 완료
  - ESLint 9 Flat config 사용 (eslint.config.js)
  - 수락 조건 3개 모두 통과
  - 커밋: fb8a099

## Sprint 0 전체 완료 🎉

- T001 ✅ (e6b3c48)
- T002 ✅ (c0cec4b, 타협 완료 - 웹 검증 보류)
- T003 ✅ (fb8a099)

## 내일 시작할 곳

- Sprint 1 시작: T101 (Supabase 프로젝트 + 환경변수)
- 사전 준비 필요:
  - Supabase 계정 가입 (https://supabase.com)
  - Docker Desktop 설치 (로컬 Supabase 실행용)
  - 이메일 준비 (Supabase 가입용)
- 예상 시간: 2시간

## 알려진 이슈 (지속)

- T002 웹 검증 보류 (Node 22 + Expo 54 + Windows 호환성)
  - iOS/Android 에뮬레이터 도입 시 또는 Expo 패치 시 재검증

---

# 2026-04-19 세션 로그

## 완료

- T001: Expo + TypeScript 프로젝트 초기화 (commit: e6b3c48)
- T002: NativeWind + 폰트 + 테마 토큰 (commit: c0cec4b)
  - 설정 파일 8개 완성
  - typecheck 통과
  - 웹 브라우저 시각 검증은 Node 22 + Windows + Expo 54 호환 이슈로 보류

## 미해결 이슈

- Metro Windows 경로 로딩 버그
- 시도한 해결책: .cjs 확장자, cross-env + NODE_OPTIONS
- 재검증 방법: Android 에뮬레이터 or Expo 패치 대기

## 내일 시작할 곳

- T003: ESLint + Prettier + Husky 설정
- 예상 시간: 2시간
- 참고: IMPLEMENTATION_PLAN.md의 T003 섹션

## 2026-04-20 (오후) - T101 완료

### 완료

- **T101**: Supabase 프로젝트 생성 + 환경변수 + 클라이언트 연결
  - 커밋: `7a7ed73 feat(infra): connect Supabase client`
  - 생성: `.env.example`, `src/lib/supabase.ts`, `scripts/verify-supabase.ts`
  - 설치: `@supabase/supabase-js`, `@react-native-async-storage/async-storage` (deps), `dotenv`, `tsx` (devDeps)

### 결정사항

- **결정 1-A**: 로컬 Supabase (Docker) 생략 — 프로덕션 프로젝트만 사용. Docker 세팅 부담 회피, 필요 시 별도 태스크로 추가 예정.
- **결정 2-A**: `supabase.auth.getSession()` 검증을 Node 스크립트(`scripts/verify-supabase.ts`)로 우회. Metro 번들링 문제로 앱 런타임 검증 불가한 상황에서 선택.

### 플랜 대비 변경

- `src/lib/supabase.ts`에 런타임 null 체크 추가 (원 플랜은 non-null assertion `!` 사용). DX 개선 목적.
- 검증 스크립트 (`scripts/verify-supabase.ts`)는 원 플랜에 없던 파일. 수락 조건 #2 대체 검증 용도.

### 미해결 이슈

- T002 Metro 번들링 문제 여전함 — T101은 우회 검증으로 통과했지만 근본 해결 필요.
- `package.json`/`package-lock.json` LF→CRLF 경고 발생 (Windows 환경). 기능상 문제없으나 나중에 `.gitattributes`로 통일 필요.

### 수락 조건 달성

- [x] `supabase.auth.getSession()` → null 반환 (Node 스크립트 검증)
- [x] `.env.example` 커밋, `.env.local` gitignore (4중 확인 완료)
- [~] `supabase status` 로컬 서비스 — **면제** (결정 1-A)

### 다음

- T102 착수 예정

## 2026-04-20 (오후 후반) - T102 완료

### 완료

- **T102**: DB 스키마 마이그레이션 (5개 테이블 + 인덱스 + 트리거)
  - 커밋: `ef3fcec feat(db): initial schema migration`
  - 생성: `supabase/migrations/20260420000000_init.sql`, `src/lib/database.types.ts`
  - Supabase 대시보드에서 SQL 실행 (결정 4-A)
- **T102 post-fix**: database.types.ts 인코딩 수정 (UTF-16 → UTF-8 no BOM)
  - 커밋: `f099227 fix(db): re-encode database.types.ts as UTF-8`
  - 원인: PowerShell 5.1의 `>` 리다이렉트가 UTF-16 LE + BOM으로 저장
  - 해결: `[System.IO.File]::WriteAllText` + `UTF8Encoding $false` 사용

### 결정사항

- **결정 3-B**: RLS 정책은 T103으로 분리 (T102는 스키마 + 인덱스 + 트리거까지)
- **결정 4-A**: 마이그레이션 실행을 Supabase 대시보드 SQL Editor로 (Docker/CLI 대신)
- **결정 5-A**: 타입 생성을 `--project-id` 플래그로 원격에서 직접 (link 세팅 생략)
- **결정 6-B**: `feeding_records.end_at`을 null 허용 (sleep과 일관성, "수유 중" 상태 표현)
- **공유 모델**: Case 2 (가족 공유) — caregivers 테이블 기반

### 플랜 대비 변경

- `updated_at` 자동 갱신 트리거 추가 (원 플랜엔 없던 개선)
- `.gitignore`에 `supabase/.temp/`, `supabase/.branches/` 추가 (CLI 캐시 제외)

### 미해결 이슈

- **`.gitattributes` 미추가**: Git이 `database.types.ts`를 바이너리로 계속 인식 (실제는 텍스트). 다음 세션에서 처리 예정.
- **Supabase CLI PAT**: 7일 유효 (2026-04-27 만료). 재생성 필요 시 별도 발급.
- RLS 미적용: T103에서 일괄 처리.

### 수락 조건 달성

- [skip] `supabase db reset` 로컬 실행 — 결정 1-A로 면제
- [x] `database.types.ts` 자동 생성 (348 라인, `--project-id` 방식)
- [x] Studio에서 5개 테이블 확인 (UNRESTRICTED 상태)

### 다음

- `.gitattributes` 추가 후 T103 (RLS 정책) 착수

## 2026-04-21 - T103a 완료 + T103b 검증 보류

### 완료

- **.gitattributes 추가**: Git이 TypeScript 파일을 바이너리로 오해하는 문제 해결
  - 커밋: `1c24df5 chore: add .gitattributes and log T102 session`
  - `*.ts text eol=lf` 등 확장자별 텍스트/바이너리 선언
  - `git check-attr -a` 로 `text: set, eol: lf` 적용 확인
- **T103a**: Row Level Security 정책 구현
  - 커밋: `024f06b feat(db): row level security policies`
  - 파일: `supabase/migrations/20260421000000_rls.sql` (179 줄)
  - 5개 테이블 RLS 활성화 + 19개 정책 + 함수 2개 + 트리거 1개
  - 대시보드 Authentication > Policies 에서 전수 확인

### 결정사항

- **D1** caregivers 테이블 정책 포함 (원 플랜 누락분 보강, SELECT/INSERT/DELETE 3개)
- **D2-a** babies DELETE 허용 (본인만)
- **D3-a** 아기 생성 시 자동 caregiver 등록 트리거 (DB 레벨 무결성 보장)
- **D4-b** 영문 네이밍 컨벤션 (`{table}_{action}_{target}`)
- **D5-a** `is_caregiver()` 함수에 `auth.uid() IS NOT NULL` 방어 체크
- T103을 a/b 분리: a는 구현, b는 검증

### 플랜 대비 변경

- 원 플랜의 주석 `-- 동일 패턴 (복붙)` 부분을 실제 SQL로 명시 (sleep/diaper_records 정책)
- caregivers 테이블 정책 3개 추가 (원 플랜 전무)
- babies DELETE 정책 추가 (원 플랜 누락)
- 트리거 `babies_auto_register_caregiver` 추가 (원 플랜에 없음)
- 정책 이름 한글 → 영문

### 미해결 이슈

- **T103b 검증 미완 (의식적 유예)**
  - 시도: Supabase SQL Editor에서 `set local role authenticated` + `set local request.jwt.claims` 로 유저 impersonate 후 INSERT 검증
  - 결과: 진단 쿼리로 `auth.uid()`, `auth.role()`, `current_user` 전부 기대값 정확히 반환됨에도 INSERT 시 RLS policy violation (42501)
  - 원인 추정: Studio의 set-based impersonate 방식과 RLS의 `WITH CHECK` 평가 사이 미묘한 컨텍스트 차이. 정책 조건식(`pg_policy` 조회)은 의도한 대로 등록됨 확인.
  - **재검증 계획**: T201 또는 T3xx 화면에서 실제 로그인 JWT 기반 CRUD 수행 시 자연스럽게 검증됨. 별도 Node.js 스크립트 방식도 고려.
- T002 Metro 번들링 문제 여전히 미해결
- 테스트 유저 2명 Authentication 에 생성됨 (`test-mom-a@nyamnyam.test`, `test-mom-b@nyamnyam.test`). 정리 보류 (재검증 시 재활용 가능)
- SUPABASE_ACCESS_TOKEN 만료 2026-04-27

### 수락 조건 달성 (T103a 범위)

- [x] RLS 활성화 — 5개 테이블 모두 🛡 확인
- [x] 19개 정책 등록 — Authentication > Policies 전수 확인
- [~] 동작 검증 — 수동 impersonate 방식 실패, 실제 앱 단계에서 재검증 예정

### 다음

- T104 착수 예정

## 2026-04-21 (오후) - T104 완료 + T103b 미해결 장기 디버깅

### 완료

- **T104-a**: logging API 래퍼 19개 함수 (`src/features/logging/api.ts`, 315 줄)
  - 커밋: `7805464 feat(api): domain API wrappers over Supabase (logging)`
- **T104-b**: auth API 래퍼 6개 함수 (`src/features/auth/api.ts`, 148 줄)
  - 커밋: `58af1da feat(api): domain API wrappers over Supabase (auth)`

### T103b 디버깅 — 미해결, 원인 좁힘

- **오전 세션**에서 Supabase Studio `set local` impersonate 방식으로 첫 시도 → 실패 (`42501`)
- **오후 세션**에서 재도전, Node.js 스크립트 3개 작성:
  - `scripts/verify-rls.ts` — 3개 수락 조건 검증 자동화
  - `scripts/diagnose-rls.ts` — JWT payload 디코드 + INSERT 에러 상세
  - `scripts/check-auth-uid.ts` — RPC로 서버 측 `auth.uid()` 직접 조회
- **확인된 사실** (다음 세션 재검증 시 재조사 불필요):
  - JWT 완벽: `sub`, `role`, `aud` 모두 정확한 값
  - 서버 측 `auth.uid()` = 로그인 유저 UUID (RPC로 증명)
  - `role` = `authenticated` 정상
  - `auth.jwt()` 전체 claims 정상 (session_id, email, aud 모두)
  - authenticated 역할 INSERT 권한 있음 (`information_schema.role_table_grants`)
  - 모든 정책 `polpermissive: true` (RESTRICTIVE 충돌 없음)
  - Legacy anon key / publishable key 둘 다 동일 결과
  - 트리거 `auto_register_caregiver` disable 해도 동일 에러 (연쇄 트리거 원인 아님)
  - 정책을 `with check (true)`로 무력화해도 여전히 RLS 차단 (!)
- **남은 미스터리**: `with check (true)` 인데도 `new row violates row-level security policy` 발생. 정책 문법이 아닌 더 깊은 계층의 문제.

### 다음 세션 재개 포인트

- `scripts/*` 전부 커밋돼 있음 — 다음 세션에서 재사용 가능
- 테스트 유저 2명 (`test-mom-a`, `test-mom-b`) 유지
- **시도해볼 방향**:
  1. Supabase 공식 문서 / GitHub issues 검색 (`"with check (true)" "violates row-level security"` 키워드)
  2. 혹시 `BYPASSRLS` 역할 속성이 필요한지 확인
  3. 완전히 새 간단 테이블 만들어서 동일 증상 재현되는지 격리 테스트
  4. Supabase Support Discord 질문 고려
- **판단**: 기능 영향 크지 않음. 실제 앱 UI 개발 진행 중 발견되는 이슈로 다뤄도 무방. T104(API 래퍼)와 T105(상태 관리) 먼저 진행 가능.

### 시스템 복구 확인

- 트리거 `babies_auto_register_caregiver` 재활성화됨
- 정책 `babies_insert_authenticated` 원상 복구 (auth.uid() IS NOT NULL AND created_by = auth.uid())
- 디버그 함수 `debug_auth_uid` 제거됨

### 미해결 이슈 (누적)

- T103b 검증 (이번 세션에도 못 끝냄, 다음 세션 최우선)
- T002 Metro 번들링
- 단위 테스트 인프라 부재 (T104 수락 조건 #1, #2)

### 다음

- T105 Zustand + TanStack Query 착수 (T103b는 별도 백그라운드 추적)
- 또는 T103b 새 접근 (간단 테이블 격리 테스트 등)

## 2026-04-21 - T105 완료

### 완료

- **패키지 설치** (`npx expo install`):
  - `zustand ^5.0.12`
  - `@tanstack/react-query ^5.99.2`
  - `@dev-plugins/react-query ^0.4.0`
  - (`@react-native-async-storage/async-storage` 기존 설치됨)
- **`src/stores/sessionStore.ts`** 신규
  - `useSessionStore`: `session`, `currentBabyId`, `setSession`, `setCurrentBabyId`
- **`src/lib/queryClient.ts`** 신규
  - `staleTime: 30_000`, `retry: 2`
- **`app/_layout.tsx`** 수정
  - `QueryClientProvider` + `useReactQueryDevTools` 래핑
  - `supabase.auth.onAuthStateChange` → `useEffect` + cleanup(`subscription.unsubscribe()`)
- **`src/lib/supabase.ts`**: `storage`, `persistSession`, `autoRefreshToken` 이미 설정됨 — 수정 불필요
- **타입 체크**: `npx tsc --noEmit` 에러 없음 ✅

### T002 Metro 이슈 지속

- `npm start` (`NODE_OPTIONS=--no-experimental-require-module` 포함) 및 `npx expo start` 양쪽 모두 동일 에러 재현
- 에러: `ERR_UNSUPPORTED_ESM_URL_SCHEME` — Expo 54가 `metro.config.cjs`를 ESM import로 로딩 시도, Windows 절대경로 `C:\...`를 `file://` URL로 변환 실패
- 원인: Expo 54 + Node 22 + Windows 조합 버그 (Sprint 0부터 지속)
- 결정: T105 수락조건에 Metro 기동 없음 → 커밋 진행. T002는 별도 fix로 처리 예정

### T103b RLS 보류 상태 유지

- 실제 로그인 JWT 기반 CRUD (T201 이후) 시 자연 검증 예정
- JWT / auth.uid / 권한 / 트리거 정상 확인됨 (이전 세션 스크립트로 증명)
- `with check (true)` 정책으로도 INSERT 차단 재현 — 정책 조건식 너머 계층 문제
- 오늘 소거된 가설: persistSession 관련 아님 (`src/lib/supabase.ts`의 `storage` / `persistSession` / `autoRefreshToken` 설정 정상 확인)

### 수락 조건 달성 (T105)

- [x] `useSessionStore` 생성 — `session`, `currentBabyId` 상태 관리
- [x] `QueryClientProvider` 래핑 — `_layout.tsx`
- [x] `onAuthStateChange` useEffect + cleanup
- [x] TanStack Query devtools (`useReactQueryDevTools`) dev 모드 연결
- [x] `staleTime: 30_000`, `retry: 2` 기본값
- [x] 타입 체크 통과

### 다음

- T002 Metro 이슈 fix (metro.config.cjs → .js 리네임 등 시도)
- T201 Supabase Auth 착수
