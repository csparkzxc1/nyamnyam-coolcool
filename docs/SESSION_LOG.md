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
