/**
 * Home greeting utilities — 시간대별 한국어 인사 + 아기 D+ 일수 계산.
 *
 * 카피 톤: 부드럽고 친근하게.
 */

/**
 * 현재 로컬 시각을 기준으로 시간대별 한국어 인사 반환.
 *
 *  0 ~  4시 → "고생 많아요"
 *  5 ~ 11시 → "좋은 아침이에요"
 * 12 ~ 17시 → "좋은 오후예요"
 * 18 ~ 21시 → "좋은 저녁이에요"
 * 22 ~ 23시 → "오늘도 수고했어요"
 */
export function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 0 && h < 5) return '고생 많아요';
  if (h >= 5 && h < 12) return '좋은 아침이에요';
  if (h >= 12 && h < 18) return '좋은 오후예요';
  if (h >= 18 && h < 22) return '좋은 저녁이에요';
  return '오늘도 수고했어요';
}

/**
 * 출생일로부터 오늘까지의 일수를 'D+N' 형식으로 반환.
 *
 * birthDateIso: 'YYYY-MM-DD' (DB babies.birth_date 포맷)
 *
 * 출생일 당일은 D+0. 미래 날짜 입력 시 'D+0' 반환 (안전 가드).
 */
export function getDdayLabel(birthDateIso: string, now: Date = new Date()): string {
  const [y, m, d] = birthDateIso.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  // 시각 정보 제거 (일자 단위 비교)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((today.getTime() - birth.getTime()) / msPerDay);
  return `D+${Math.max(0, diffDays)}`;
}
