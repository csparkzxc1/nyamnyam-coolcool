/**
 * Six sleep cues from PRD §4.4 — surfaced as the "졸림 신호" educational
 * card list on the Guide tab. Catching cues early is the single biggest
 * lever a caregiver has on sleep quality, so this list is also the
 * content the predicted-sleep notification (T602) refers users back to.
 *
 * Each entry has a short headline (the cue itself) and an expanded body
 * that explains *what to look for* and *why it matters* in concrete,
 * non-clinical language. The PRD explicitly forbids diagnostic phrasing
 * (CLAUDE.md §11.9) so the copy stays observational.
 */

export interface SleepCue {
  /** Stable id — used as React key and for tests. */
  id: string;
  /** Emoji used as the card's visual anchor (no native SVG dependency). */
  icon: string;
  /** One-line cue name, shown collapsed. */
  title: string;
  /** "어떤 모습일까요" body, shown expanded. */
  description: string;
}

export const SLEEP_CUES: readonly SleepCue[] = [
  {
    id: 'eye-rub',
    icon: '👀',
    title: '눈 비비기',
    description:
      '주먹이나 손등으로 눈을 자꾸 문지르면 졸리다는 가장 흔한 신호예요. 눈물이 나오는 것 같다면 더 확실한 단계예요.',
  },
  {
    id: 'yawn',
    icon: '🥱',
    title: '하품',
    description:
      '15~20분 사이에 두세 번 하품하면 졸림 신호 초기 단계예요. 첫 하품에 재울 준비를 시작하면 가장 수월해요.',
  },
  {
    id: 'ear-pull',
    icon: '👂',
    title: '귀 잡아당기기',
    description:
      '귀를 만지거나 잡아당기는 행동은 자기 위로(self-soothing) 시작 신호예요. 아프거나 가려운 게 아니라면 졸림으로 보아도 좋아요.',
  },
  {
    id: 'gaze-blur',
    icon: '🌫️',
    title: '시선이 흐려져요',
    description:
      '초점이 풀리거나 한 곳을 멍하게 응시한다면 뇌가 휴식을 준비하는 단계예요. "딴 데 보네" 싶을 때가 적기예요.',
  },
  {
    id: 'fussy',
    icon: '😣',
    title: '칭얼거림이 늘어요',
    description:
      '조금 전까지 잘 놀던 아이가 자꾸 보채고 짜증을 내면, 이미 늦은 졸림 단계일 수 있어요. 이 단계에서는 빨리 진정 환경을 만들어 주세요.',
  },
  {
    id: 'still',
    icon: '🐌',
    title: '움직임이 둔해져요',
    description:
      '활발하던 손발 움직임이 느려지거나 멍하니 누워 있다면 잘 준비가 되었다는 뜻이에요. 너무 자극을 주지 말고 조용한 환경으로 옮겨 주세요.',
  },
];

export const SLEEP_CUE_OVERTIRED_WARNING =
  '이 신호를 놓치면 과각성(overtired) 상태가 되어 잠들기가 더 어려워져요. 첫 신호에 재울 준비를 시작하면 가장 쉽게 잠들어요.';
