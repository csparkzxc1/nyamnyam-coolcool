# 🚀 START HERE — 5분 안에 시작하기

처음 이 저장소를 만나신 분을 위한 빠른 시작 가이드입니다.

---

## 🎯 이 프로젝트가 지금 어디쯤 있나요

```
[✅] 기획 완료       — PRD, SPEC, ADR 작성 완료
[✅] 디자인 완료     — 인터랙티브 프로토타입 확인 가능
[✅] 알고리즘 검증   — 예측 엔진 TypeScript 코드 컴파일·실행 검증 완료
[✅] 작업 계획 완료  — 40개 태스크로 분해 완료
[ ] Phase 1 MVP    ← 여기서 시작합니다
[ ] Beta 테스트
[ ] 앱스토어 출시
```

---

## 📦 0단계 — 환경 준비 (30분, 최초 1회만)

### 필수 설치
```bash
# macOS 기준. Windows/Linux는 각 공식 사이트 참조
brew install node@20 git
brew install --cask docker                    # Supabase 로컬용
npm install -g expo-cli eas-cli               # Expo 도구
npm install -g @anthropic-ai/claude-code      # Claude Code
```

### iOS 개발 (Mac 전용)
```bash
# App Store에서 Xcode 설치
sudo xcode-select --install
```

### Android 개발
Android Studio 설치 → AVD Manager에서 에뮬레이터 생성 (Pixel 7 API 34 추천)

### 확인
```bash
node -v          # v20.x.x 이상
docker -v        # Docker version 24+
claude --version # Claude Code 버전 표시
```

---

## 🗂 1단계 — 저장소 준비 (5분)

이미 이 폴더를 받으셨다면 건너뛰세요.

```bash
# 새 프로젝트 폴더로 이 저장소 파일들을 옮긴 경우
cd /원하는/경로/nyamnyam-coolcool
git init
git add .
git commit -m "chore: initial project guidelines and docs"
```

GitHub 저장소 생성 후 연결:
```bash
git remote add origin https://github.com/[유저명]/nyamnyam-coolcool.git
git branch -M main
git push -u origin main
```

---

## 🤖 2단계 — Claude Code 실행 (1분)

프로젝트 루트에서:
```bash
cd nyamnyam-coolcool
claude
```

Claude Code가 실행되면 자동으로 `CLAUDE.md`를 읽습니다.
첫 명령으로 **프로젝트 파악**을 시킵니다:

```
현재 프로젝트 상태를 파악해줘.
CLAUDE.md, README.md, IMPLEMENTATION_PLAN.md를 읽고
다음에 해야 할 태스크가 뭔지 나에게 브리핑해줘.
아직 코드는 만들지 마.
```

CC가 "T001이 첫 태스크입니다"라고 답하면 준비 완료입니다.

---

## ▶️ 3단계 — 첫 태스크 실행 (3시간)

### T001 실행 명령
```
IMPLEMENTATION_PLAN.md의 T001을 실행해줘.
수락 조건을 모두 통과시킨 뒤, 완료하면 나에게 보고하고 멈춰.
커밋은 feat(setup): initialize Expo + TypeScript project 메시지로.
```

### 이때 CC가 할 일 (자동)
1. `npx create-expo-app` 으로 Expo + TypeScript 프로젝트 스캐폴딩
2. Expo Router 등 기본 패키지 설치
3. `tsconfig.json`에 `@/*` alias 추가
4. `npx expo start` 실행 테스트
5. iOS 시뮬레이터에서 "Hello" 표시 확인

### 당신이 할 일 (확인)
- CC가 "완료"라고 하면 직접 `npx expo start` 돌려보기
- 시뮬레이터에서 앱 뜨는지 확인
- 문제 없으면 → "T002 진행해줘"
- 문제 있으면 → "시뮬레이터에서 화면이 안 떠. 오류 로그는 [붙여넣기]"

---

## 🔄 이후 진행 방식 (반복)

```
┌─────────────────────────────────────┐
│ 1. CC에 다음 태스크 지시            │
│    "T002 실행해줘"                  │
│                                     │
│ 2. CC가 파일 생성·수정·테스트       │
│    (자동 · 10분~3시간)              │
│                                     │
│ 3. "완료" 보고받으면 직접 확인      │
│    - 시뮬레이터 실행                │
│    - npm run typecheck              │
│    - 수락 조건 체크                 │
│                                     │
│ 4. OK → "T003 진행"                 │
│    NG → 에러 메시지 붙여넣고 수정   │
└─────────────────────────────────────┘
```

---

## 💡 자주 쓰는 CC 명령어 템플릿

### 브리핑
```
지금까지 진행 상황 정리해줘.
완료한 태스크, 진행 중인 태스크, 다음 태스크 순으로.
```

### 단일 태스크
```
IMPLEMENTATION_PLAN.md의 T301 실행해줘.
수락 조건 모두 통과시키고 멈춰.
```

### 스프린트 단위
```
Sprint 0 전체 진행해줘.
각 태스크 완료 시마다 커밋하고, Sprint 끝나면 보고만 하고 멈춰.
```

### 막혔을 때
```
테스트가 계속 실패해. 지금 상태 요약하고,
뭘 시도했고 뭐가 안 되는지 설명해줘.
나에게 조언을 구할 부분이 있으면 질문해.
```

### 스쳐 지나간 체크
```
CLAUDE.md §11의 금지사항을 위반한 코드가 있는지
전체 파일 훑어보고 보고해줘.
```

---

## ⚠️ 주의사항 (사람이 해야 하는 것)

Claude Code가 **할 수 없는** 일들. 이 단계에서 사람 개입 필요.

| 시점 | 작업 | 참고 |
|---|---|---|
| T101 시작 전 | Supabase 계정 가입 & 새 프로젝트 생성 | https://supabase.com |
| T101 시작 전 | 환경변수 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 받아서 `.env.local`에 저장 | |
| T201 시작 전 | 카카오 개발자센터에서 앱 등록 & OAuth 키 발급 | https://developers.kakao.com |
| T903 전 | 앱 아이콘 1024x1024 디자인 | 별도 디자이너 작업 |
| T903 전 | 개인정보 처리방침 문서 법무 검토 | 변호사 의뢰 |
| 출시 전 | 소아과 전문의 감수 | `docs/SPEC.md` §5 감수 질문 10개 참조 |

---

## 🆘 뭔가 잘못됐을 때

### Claude Code가 타임아웃되거나 멈춘 경우
1. `Ctrl+C` 로 세션 종료
2. 5분 대기 (API 쿨다운)
3. 새 터미널에서 `claude` 재실행
4. 첫 명령: "지금 브랜치 상태 확인하고, 마지막으로 어디까지 됐는지 브리핑해줘"

### 파일이 엉뚱한 위치에 만들어진 경우
→ 당황하지 말고 CC에게 직접 지시:
```
방금 만든 [파일 경로] 삭제하고,
[올바른 경로]에 다시 만들어줘.
```

### 테스트가 이유 없이 실패
```
npm test 결과 중 실패 케이스 하나 골라서 원인 분석해줘.
환경 문제인지 코드 문제인지 먼저 구분해줘.
```

### 전부 꼬였다고 느껴질 때
```
git reset --hard HEAD~[숫자]     # 마지막 N개 커밋 취소
git clean -fd                     # 추적 안 되는 파일 삭제
```
그리고 CC에게: "지금 상태 다시 파악하고 어디서부터 재개할지 알려줘."

---

## 🎬 다음 단계

1. **환경 준비** ✅ (위 0단계)
2. **저장소 준비** ✅ (위 1단계)
3. **Claude Code 실행** → 지금 바로
4. **T001 실행** → 3시간
5. **T002 → T003 ...** → IMPLEMENTATION_PLAN.md 따라 진행

---

## 📖 계속 참고할 문서

- `QUICK_REFERENCE.md` — 태스크 번호 해석, 용어, CC 명령 패턴 1페이지
- `CLAUDE.md` — CC가 매 세션 읽는 룰북 (내가 직접 볼 일은 거의 없음)
- `IMPLEMENTATION_PLAN.md` — 각 태스크 수락 조건 확인할 때만
- `docs/ADR.md` — "왜 이 기술이지?" 궁금할 때

---

**행운을 빕니다. 🍀**
**막히면 언제든 이 채팅창에 에러 메시지 붙여넣고 물어보세요.**

---

*© 2026 · 냠냠쿨쿨 프로젝트 · START HERE v1.0*
