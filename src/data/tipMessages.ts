/**
 * Static pool of encouragement / tip messages shown on the home screen
 * TipCard.
 *
 * These are the GENERIC fallback pool used when the app does not yet have
 * enough data to generate fact-based messages (e.g., during the first 7 days
 * of usage). Once the prediction engine is wired up (T401), fact-based
 * messages like "윤서아가 지난주보다 밤잠을 30분 더 자고 있어요" will be
 * generated dynamically from observed patterns and will take precedence.
 *
 * Design constraints:
 * - Tone: warm, supportive, never preachy or guilt-inducing.
 * - Voice: addressed to the caregiver, not the baby.
 * - Length: 2~3 lines that fit comfortably inside the card.
 * - No medical advice or specific numbers (those belong in fact-based pool).
 */

export interface TipMessage {
  /** Card header label, e.g., "오늘의 응원". */
  label: string;
  /** Main message body. */
  message: string;
}

export const GENERIC_TIP_MESSAGES: readonly TipMessage[] = [
  {
    label: '오늘의 응원',
    message: '잘하고 있어요. 신생아의 하루는 길고 짧아요.\n오늘 한 호흡 한 호흡이 충분해요.',
  },
  {
    label: '오늘의 응원',
    message: '완벽한 부모는 없어요.\n오늘 아기 옆에 있어준 것만으로 충분합니다.',
  },
  {
    label: '오늘의 응원',
    message: '밤이 길어 보여도 새벽은 꼭 와요.\n조금만 더 같이 가봐요.',
  },
  {
    label: '오늘의 작은 팁',
    message: '아기가 칭얼대도 항상 배고픔은 아니에요.\n안아주는 것만으로도 진정될 때가 많아요.',
  },
  {
    label: '오늘의 작은 팁',
    message: '수유 후 5~10분 트림 시간을 가지면\n역류와 보채는 시간이 줄어들 수 있어요.',
  },
  {
    label: '오늘의 응원',
    message: '엄마/아빠도 사람이에요.\n잠깐의 휴식은 죄책감이 아니라 필요예요.',
  },
  {
    label: '오늘의 작은 팁',
    message: '아기 옷은 어른보다 한 겹 더 정도가 적당해요.\n등을 만져봐서 따뜻하면 충분합니다.',
  },
  {
    label: '오늘의 응원',
    message: '오늘 못 한 것보다 오늘 한 것에 집중해보세요.\n작은 일들이 쌓여 큰 사랑이 됩니다.',
  },
  {
    label: '오늘의 작은 팁',
    message: '아기와 눈을 맞추는 30초가\n하루 중 가장 큰 발달 시간이에요.',
  },
  {
    label: '오늘의 응원',
    message: '잠을 못 자는 건 사랑이 부족해서가 아니에요.\n신생아는 원래 자주 깨요.',
  },
  {
    label: '오늘의 작은 팁',
    message:
      '아기가 깨어 있을 때 배밀이 시간을 짧게라도\n가져보세요. 목 근육 발달에 도움이 됩니다.',
  },
  {
    label: '오늘의 응원',
    message: '하루 중 한 번이라도 웃었다면\n오늘은 좋은 하루였어요.',
  },
  {
    label: '오늘의 작은 팁',
    message: '신생아는 하루 16~18시간 자는 게 평범해요.\n많이 잔다고 걱정하지 않아도 돼요.',
  },
  {
    label: '오늘의 응원',
    message: '비교는 도둑이에요.\n다른 아기가 아니라 어제의 우리 아기랑만 비교해요.',
  },
  {
    label: '오늘의 작은 팁',
    message: '아기가 새벽에 깨면 불을 최대한 어둡게,\n말은 짧고 조용하게. 다시 잠들기 쉬워요.',
  },
];

/**
 * Picks a tip message based on a stable daily seed so the same message is
 * shown throughout the day and changes the next day. Caller passes a Date;
 * defaults to the live Date.
 *
 * Note: this is a placeholder picker for the generic pool. Pattern-based
 * selection (e.g., emphasising sleep tips during night-feed-heavy days) is
 * deferred to T401 once the prediction engine lands.
 */
export function pickDailyTip(date: Date = new Date()): TipMessage {
  // Use day-of-year as the seed so the message is stable per calendar day.
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const index = dayOfYear % GENERIC_TIP_MESSAGES.length;
  return GENERIC_TIP_MESSAGES[index];
}
