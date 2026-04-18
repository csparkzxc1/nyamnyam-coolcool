# 냠냠쿨쿨 (NyamNyam CoolCool)

초보엄마를 위한 수면·수유 예측 알림 모바일 앱

> **현재 단계**: Phase 1 MVP 개발 시작 전 (기획 문서 완비 · 코드 0줄)
> **스택 확정**: Expo + React Native + TypeScript + Supabase + NativeWind
> **예상 기간**: 8주 풀타임 · 40 태스크 · 약 128시간

---

## 📂 이 저장소에 뭐가 있나요

```
nyamnyam-coolcool/
│
├── README.md                      ← 지금 이 파일 (진입점)
├── START_HERE.md                  ← 처음 오신 분 · 5분 가이드
│
├── CLAUDE.md                      ← Claude Code 룰북 (매 세션 자동 참조)
├── IMPLEMENTATION_PLAN.md         ← 40개 태스크 상세 실행 계획
├── QUICK_REFERENCE.md             ← 태스크·용어 1페이지 요약
│
└── docs/
    ├── PRD.md                             ← 제품 요구사항 정의서
    ├── SPEC.md                            ← UI·알고리즘 상세 스펙
    ├── ADR.md                             ← 기술 결정 근거 기록
    ├── prediction_engine_reference.ts     ← 검증된 예측 엔진 (참조용)
    └── design_prototype.html              ← 인터랙티브 디자인 프로토타입
```

---

## 🧑 사용자 유형별 읽기 순서

### 👤 기획자·PO라면 (15분)
1. `START_HERE.md` → 전체 흐름 파악
2. `QUICK_REFERENCE.md` → 태스크·용어 1페이지
3. `docs/design_prototype.html` → 브라우저에서 열기, 실제 UI 확인
4. `docs/PRD.md` → 뭘 만드는지

### 👨‍💻 개발자라면 (30분)
1. `CLAUDE.md` → 스택·컨벤션·금지사항
2. `docs/ADR.md` → 왜 이 기술을 골랐나
3. `IMPLEMENTATION_PLAN.md` → 40개 태스크 플로우
4. `docs/SPEC.md` → UI 명세 & 예측 알고리즘
5. `docs/prediction_engine_reference.ts` → 검증된 TS 엔진

### 🤖 Claude Code라면 (자동)
프로젝트 루트에서 `claude` 실행 시 `CLAUDE.md`를 자동으로 참조합니다.
첫 명령: **"IMPLEMENTATION_PLAN.md의 T001을 실행해줘"**

---

## ⚡ 빠른 시작

### 1) 문서만 확인하고 싶다면
`docs/design_prototype.html`을 브라우저에서 열면 앱 UI를 직접 체험할 수 있습니다.
(좌측: 폰 화면 / 우측: 예측 엔진 디버그 패널)

### 2) 개발 시작하려면
`START_HERE.md`를 먼저 읽으세요. 필요 환경·명령·첫 태스크가 전부 정리돼 있습니다.

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **제품명** | 냠냠쿨쿨 (NyamNyam CoolCool) |
| **타겟** | 0~12개월 영아를 둔 부모, 특히 산후 6주 이내 초보엄마 |
| **핵심 가치** | 기록 앱이 아닌 **예측·알림 앱**. 엄마가 시계 보지 않아도 되게 |
| **차별점** | 기존 경쟁 앱(베이비타임·쑥쑥찰칵)은 기록 중심. 본 앱은 **월령별 표준 × 개인 패턴 가중평균 예측 엔진** 중심 |
| **데이터 출처** | 보건복지부 아이사랑 · 대한소아청소년과학회 · AAP · AASM 2016 |

---

## ⚠️ 중요 고지

본 앱은 **의료기기가 아닙니다.** 모든 정보·알림은 참고용이며, 의학적 진단을 대체하지 않습니다.
출시 전 반드시 소아과 전문의 감수를 받아야 합니다 (`docs/SPEC.md` §5 감수 질문 10개 참조).

---

*© 2026 · NyamNyam CoolCool Project · 한국*
