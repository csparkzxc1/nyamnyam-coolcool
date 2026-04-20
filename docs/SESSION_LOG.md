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
