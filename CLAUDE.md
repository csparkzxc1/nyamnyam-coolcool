# CLAUDE.md — 냠냠쿨쿨(NyamNyam CoolCool) 프로젝트 가이드

> **이 파일은 Claude Code가 매 세션 시작 시 반드시 읽어야 하는 룰북입니다.**
> 아래 규칙에서 벗어나는 변경이 필요하면 코드 작성 전에 사용자에게 먼저 확인하세요.

---

## 1. 프로젝트 개요

| 항목 | 값 |
|---|---|
| 제품명 | 냠냠쿨쿨 (NyamNyam CoolCool) |
| 한줄 정의 | 초보엄마를 위한 수면·수유 예측 알림 모바일 앱 |
| 주 사용자 | 0~12개월 영아를 둔 부모, 특히 산후 6주 이내 초보엄마 |
| 현재 단계 | Phase 1 MVP 개발 (3개월 목표) |

핵심 가치: **기록 앱이 아니라 예측·알림 앱**. 엄마가 시계 보지 않아도 되게 한다.

---

## 2. 확정된 기술 스택 (변경 금지 — 변경 필요 시 사용자 확인 필수)

### 모바일
- **Expo SDK (latest stable)** + **React Native** + **TypeScript (strict)**
- 네비게이션: **Expo Router** (파일 기반 라우팅)
- 스타일: **NativeWind v4** (Tailwind for RN)
- 상태관리: **Zustand** (클라이언트 상태) + **TanStack Query v5** (서버 상태)
- 폼: **react-hook-form** + **zod** (검증)
- 날짜: **date-fns** (moment 금지 — 번들 크기)
- 알림: **expo-notifications**
- 아이콘: **lucide-react-native**

### 백엔드
- **Supabase** (PostgreSQL + Auth + Realtime + Storage)
- 인증: 이메일/비밀번호 + 카카오 OAuth (국내 타겟)
- DB 접근: `@supabase/supabase-js` v2
- 실시간 동기화: Supabase Realtime (가족 공유용)
- Row Level Security(RLS) 필수 — 모든 테이블

### 테스트
- 단위 테스트: **Jest** + **@testing-library/react-native**
- E2E: **Maestro** (Detox보다 셋업 가벼움)

### CI/CD
- EAS Build (Expo Application Services)
- GitHub Actions (린트·테스트만, 빌드는 EAS)

---

## 3. 명령어 (외우지 말고 이 표 참조)

### 개발 환경
```bash
# 초기 셋업 (프로젝트 처음 받을 때)
npm install
npx expo prebuild --clean   # iOS/Android 네이티브 프로젝트 생성

# 개발 서버 실행
npx expo start              # 기본 (개발 클라이언트)
npx expo start --ios        # iOS 시뮬레이터
npx expo start --android    # Android 에뮬레이터
```

### 린트 & 포매팅 & 타입체크
```bash
npm run lint          # eslint 실행
npm run lint:fix      # 자동 수정
npm run format        # prettier
npm run typecheck     # tsc --noEmit
```

### 테스트
```bash
npm test              # 전체 Jest 테스트
npm test -- --watch   # watch 모드
npm run test:e2e      # Maestro E2E 시나리오
```

### Supabase
```bash
npx supabase start              # 로컬 Supabase (Docker 필요)
npx supabase db reset           # 로컬 DB 초기화 + 마이그레이션 재적용
npx supabase db push            # 프로덕션에 마이그레이션 반영
npx supabase gen types typescript --local > src/lib/database.types.ts
```

### 빌드 & 배포
```bash
eas build --profile preview --platform ios
eas build --profile production --platform all
eas submit --platform ios
```

---

## 4. 폴더 구조 (엄격히 지킬 것)

```
nyamnyam-coolcool/
├── CLAUDE.md                    # ← 이 파일
├── IMPLEMENTATION_PLAN.md       # 태스크별 실행 가이드
├── README.md
├── package.json
├── app.json                     # Expo 설정
├── tsconfig.json
├── eas.json                     # EAS Build 프로파일
├── .env.example
├── .env.local                   # (gitignore)
│
├── app/                         # Expo Router 파일 기반 라우팅
│   ├── _layout.tsx              # 루트 레이아웃
│   ├── index.tsx                # 진입점 (스플래시 → 로그인/홈 라우팅)
│   ├── (tabs)/                  # 탭 그룹
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── records.tsx
│   │   ├── guide.tsx
│   │   ├── share.tsx
│   │   └── settings.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── onboarding/
│       └── [step].tsx           # 1~5 단계
│
├── src/
│   ├── components/              # 재사용 UI 컴포넌트
│   │   ├── home/                # 홈 화면 전용
│   │   │   ├── NextActionCard.tsx
│   │   │   ├── QuickLogButton.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── TipCard.tsx
│   │   ├── shared/              # 범용
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Avatar.tsx
│   │   └── icons/
│   │
│   ├── features/                # 도메인별 비즈니스 로직
│   │   ├── prediction/          # 예측 엔진 (기존 prediction_engine.ts 이식)
│   │   │   ├── engine.ts
│   │   │   ├── standards.ts
│   │   │   ├── anomalies.ts
│   │   │   ├── types.ts
│   │   │   └── __tests__/
│   │   ├── logging/             # 원탭 기록
│   │   ├── notifications/       # 로컬 알림 스케줄링
│   │   ├── auth/                # 로그인/회원가입
│   │   └── sharing/             # 가족 공유
│   │
│   ├── lib/
│   │   ├── supabase.ts          # Supabase 클라이언트 초기화
│   │   ├── database.types.ts    # supabase gen types 결과물
│   │   ├── theme.ts             # NativeWind/Tailwind 테마 토큰
│   │   ├── notifications.ts     # expo-notifications 래퍼
│   │   └── i18n/
│   │
│   ├── hooks/                   # 재사용 React 훅
│   │   ├── useBaby.ts
│   │   ├── usePrediction.ts
│   │   └── useNotifications.ts
│   │
│   ├── stores/                  # Zustand 스토어
│   │   ├── sessionStore.ts
│   │   └── uiStore.ts
│   │
│   └── constants/
│       ├── colors.ts
│       └── config.ts
│
├── assets/
│   ├── fonts/
│   │   ├── Fraunces-Variable.ttf
│   │   └── Pretendard-Variable.ttf
│   └── images/
│
├── supabase/
│   ├── config.toml
│   ├── migrations/              # 순번_설명.sql
│   │   ├── 20260418000000_init.sql
│   │   └── 20260418000100_rls.sql
│   └── seed.sql
│
├── docs/
│   └── ADR.md                   # 아키텍처 결정 기록
│
└── __tests__/                   # 통합 테스트
    └── e2e/                     # Maestro 시나리오
```

**원칙**:
- `app/`는 라우팅만. 비즈니스 로직 금지. `src/`의 컴포넌트·훅을 조립하는 역할만.
- `src/features/`는 도메인 경계. feature 간 import 최소화. 공통은 `src/lib`·`src/components/shared`로.
- 한 파일 300줄 넘으면 쪼개기 검토.

---

## 5. 코딩 컨벤션

### TypeScript
- `strict: true` — `any` 금지. 모르면 `unknown`.
- 타입은 가능한 inferred 사용. 명시 타입은 공개 API(props, return type) 위주.
- 타입 파일(.types.ts)과 값 파일 분리.
- Null 체크는 `??`, `?.` 사용. `!` non-null assertion 금지.

### React
- 함수형 컴포넌트만. class 컴포넌트 금지.
- Props 구조분해는 함수 시그니처에서 → `function Card({ title, onPress }: Props)`.
- `useEffect` 의존성 배열 빠뜨리지 않기. eslint-plugin-react-hooks 강제.
- 조건부 렌더링은 `&&` 대신 삼항 사용 (falsy 0 이슈 방지).

### 파일 & 네이밍
- 컴포넌트 파일·export: PascalCase (`NextActionCard.tsx`, `export function NextActionCard`)
- 훅 파일: `use*.ts` (camelCase)
- 유틸·타입: camelCase (`formatDuration.ts`)
- 테스트: `*.test.ts(x)`, 같은 폴더 `__tests__/` 서브폴더에.
- 상수: `UPPER_SNAKE_CASE` (`src/constants/`)

### Import 순서 (ESLint plugin-import가 강제)
```typescript
// 1. React / Expo / RN
import { useState } from 'react';
import { View, Text } from 'react-native';

// 2. 외부 라이브러리
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. 내부 절대 경로 (@/ alias)
import { supabase } from '@/lib/supabase';
import { NextActionCard } from '@/components/home/NextActionCard';

// 4. 상대 경로
import { formatTime } from './utils';

// 5. 타입 (type-only)
import type { Baby } from '@/features/prediction/types';
```

tsconfig `paths`에 `@/*` → `src/*` 매핑 필수.

### 스타일 (NativeWind)
- 모든 스타일은 `className` 속성으로. StyleSheet API 사용 금지.
- 커스텀 색상·간격은 `tailwind.config.js`의 `extend`에 정의 (src/lib/theme.ts에서 가져옴).
- 다크모드: `dark:` 프리픽스 필수 사용. 새벽 수유 대응은 별도 `night:` variant(플러그인)로.

예시:
```tsx
<View className="rounded-2xl bg-surface p-5 dark:bg-surface-dark">
  <Text className="font-display text-3xl text-ink-primary">
    {time}
  </Text>
</View>
```

### 에러 처리
- async 함수는 try-catch 필수. catch에서 `console.error`만 치고 끝내지 말 것 — 사용자에게 알림 UI 노출 또는 Sentry 전송.
- Supabase 호출 결과 `{ data, error }`는 **반드시 error 먼저 체크**.

---

## 6. Supabase 사용 규칙

### 클라이언트 사용
```typescript
import { supabase } from '@/lib/supabase';

// ✅ 올바름 — RLS에 맡김, user_id 필터 불필요
const { data, error } = await supabase
  .from('feeding_records')
  .select('*')
  .eq('baby_id', babyId)
  .order('start_at', { ascending: false })
  .limit(50);

if (error) throw error;
```

### RLS 원칙
- 모든 테이블에 RLS 활성화. 예외 없음.
- 정책은 `supabase/migrations/` 내 SQL로 관리. 대시보드 수동 변경 금지.
- 아기 데이터 접근은 `caregivers` 테이블 조인으로 판정 (부모·가족 공유 대응).

### Realtime
- 가족 공유된 아기의 기록 변경만 구독. 전체 테이블 구독 금지 (비용).
- unsubscribe는 useEffect cleanup에서 반드시.

### 타입 동기화
- 스키마 변경 후 반드시 `npx supabase gen types typescript --local > src/lib/database.types.ts` 실행.
- 이 파일은 수동 편집 금지.

---

## 7. 상태관리 패턴

### Zustand (클라이언트 상태만)
- 세션(로그인 상태), UI 토글, 진행 중인 기록 타이머 등 **서버에 없는 것만**.
- 서버 데이터는 절대 Zustand에 중복 저장하지 않기 → TanStack Query로.

### TanStack Query (서버 상태)
- 쿼리키는 계층적: `['feeding', babyId, { from, to }]`
- `staleTime` 기본 30초, 예측 관련은 10초
- mutation 성공 시 `invalidateQueries` 또는 `setQueryData` optimistic update

### Context는 최소한으로
- Context는 테마·i18n·세션 같은 **앱 전체 관통**만. 화면 단위는 props drilling 또는 Zustand.

---

## 8. 알림 스케줄링 규칙

로컬 알림은 **앱이 종료되어도 OS가 스케줄된 시각에 띄워줍니다**. 다만 예측이 바뀌면 기존 스케줄은 취소·재등록 필요.

```typescript
import * as Notifications from 'expo-notifications';

// 규칙 1: 기록이 추가/수정되면 곧바로 예측 재계산 → 알림 재스케줄
// 규칙 2: 최대 동시 예약 알림은 기기당 3개 (수유 1, 수면 1, 경고 1)
// 규칙 3: 방해 금지 시간대(밤 22시~6시)에는 critical 경고만 소리 허용
// 규칙 4: iOS는 Info.plist, Android는 AndroidManifest에 권한 선언 필요
```

자세한 구현은 `src/lib/notifications.ts`와 `src/features/notifications/`에.

---

## 9. 테스트 전략

| 레벨 | 대상 | 도구 | 커버리지 목표 |
|---|---|---|---|
| 단위 | `src/features/prediction/*` (순수 함수) | Jest | **90%+** (비즈니스 핵심) |
| 단위 | 유틸·훅 | Jest + RTL | 70%+ |
| 컴포넌트 | UI 컴포넌트 | RTL | 주요 컴포넌트만 (스냅샷 X) |
| E2E | 온보딩, 첫 기록, 로그인 | Maestro | 핵심 시나리오 5개 |

**예측 엔진은 단위 테스트 최우선**. 이미 `prediction_engine.ts`에 데모가 있으니 이를 표준 케이스로 잡아 Jest로 이식.

### 예시 테스트
```typescript
// src/features/prediction/__tests__/engine.test.ts
describe('predictNextFeeding', () => {
  it('0~1개월 아기가 4시간 경과 시 RED 알림', () => {
    const baby = mockBaby({ birthDaysAgo: 30 });
    const feedings = mockFeedings({ lastEndAt: hoursAgo(4.2) });
    const result = predictNextFeeding(baby, feedings, new Date());
    expect(result.alertLevel).toBe('red');
    expect(result.message).toContain('깨워서 수유');
  });
});
```

---

## 10. Git 워크플로우

- 브랜치: `main` (배포) / `develop` (통합) / `feat/*` `fix/*` `chore/*`
- 커밋 메시지: **Conventional Commits** 필수 (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`)
- PR은 IMPLEMENTATION_PLAN.md의 태스크 ID 기입 (예: `[T301] NextActionCard 구현`)
- main 직접 푸시 금지. Claude Code는 항상 feature 브랜치에서 작업.

---

## 11. 금지 사항 (Do NOT)

1. **`any` 타입** — unknown + 타입 가드 쓰기
2. **StyleSheet.create** — NativeWind만 사용
3. **moment.js / dayjs** — date-fns만 사용 (번들 크기)
4. **console.log를 프로덕션 코드에 남기기** — `__DEV__` 체크 또는 logger 유틸 경유
5. **Supabase 대시보드에서 스키마 직접 변경** — 반드시 migrations 파일로
6. **RLS 정책 누락된 새 테이블 추가** — 같은 마이그레이션에 RLS까지
7. **컴포넌트 안에서 직접 supabase 호출** — `src/features/*/api.ts` 거치기
8. **하드코딩된 색상/간격/폰트** — theme.ts·tailwind config에서만
9. **의학적 진단·판단 문구 작성** — "정상/비정상" 금지. 스펙 §4.2 참조
10. **사용자 데이터를 외부 분석 도구에 무단 전송** — 개인정보보호법 주의

---

## 12. 참조 문서 (반드시 함께 읽기)

Claude Code는 태스크 시작 전에 아래 문서 중 관련된 것을 확인하세요.

| 문서 | 용도 | 언제 보는가 |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | 태스크 분해·순서·수락 조건 | **매 태스크 시작 시** |
| `docs/ADR.md` | 기술 선택 이유 | 설계 의문 생길 때 |
| `초보엄마_알림앱_상세_프롬프트.md` | PRD 본문 (요구사항·월령별 표준) | 비즈니스 로직 구현 시 |
| `초보엄마_알림앱_스펙문서_v1.md` | UI 컴포넌트 명세·예측 알고리즘 의사코드 | 화면·알고리즘 구현 시 |
| `prediction_engine.ts` | 검증된 TypeScript 예측 엔진 | `src/features/prediction`에 이식 시 |
| `nyamnyam_coolcool_prototype.html` | 디자인 토큰·레이아웃 레퍼런스 | 컴포넌트 스타일링 시 |

---

## 13. 사용자 확인이 필요한 상황

아래 상황에서는 **코드 작성 전 반드시 사용자에게 질문**하세요.

- 스택 추가·변경 (새 라이브러리 설치 포함)
- DB 스키마 변경
- RLS 정책 완화
- Notifications 권한 범위 변경
- 의학적 문구·경고 임계값 수정
- 외부 API 연동 (카카오톡 공유 등)
- 앱스토어 제출 관련 메타데이터

---

## 14. 오늘의 최우선

현재 Sprint: **Sprint 0 — 프로젝트 셋업**
다음 태스크: `T001 — Expo 프로젝트 초기화`
자세한 내용: `IMPLEMENTATION_PLAN.md` 참조

---

*© 2026 · 냠냠쿨쿨 프로젝트 · Claude Code 전용 가이드 · v1.0*
