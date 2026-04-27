import { addMonths, differenceInDays, differenceInMonths } from 'date-fns';

/**
 * Pads a day count to a minimum of 3 digits for the "D+NNN" notation.
 * Examples: 7 → "007", 47 → "047", 147 → "147".
 */
function padDays(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * Returns a Korean-formatted age string for a baby.
 *
 * Examples:
 *   < 1 month → "생후 16일 (D+016)"
 *   ≥ 1 month → "1개월 16일 (D+047)"
 *
 * Newborn parents track everything in days during the first weeks, so the
 * "생후 N일" wording stays familiar. Once the baby is at least one calendar
 * month old, the format switches to "N개월 D일 (D+NNN)" — months first to
 * answer "how old is the baby right now" at a glance, with the D+ count as
 * a precise reference next to it.
 *
 * @param birthDate - The baby's birth date.
 * @param now      - Reference "today" date. Defaults to the current Date.
 *                   Injectable to keep the function pure for tests.
 */
export function formatBabyAge(birthDate: Date, now: Date = new Date()): string {
  const totalDays = differenceInDays(now, birthDate);

  if (totalDays < 0) {
    // Future birth date — likely a data entry error. Treat as today.
    return '생후 0일 (D+000)';
  }

  const months = differenceInMonths(now, birthDate);
  if (months === 0) {
    return `생후 ${totalDays}일 (D+${padDays(totalDays)})`;
  }

  const lastMonthBoundary = addMonths(birthDate, months);
  const remainingDays = differenceInDays(now, lastMonthBoundary);

  return `${months}개월 ${remainingDays}일 (D+${padDays(totalDays)})`;
}

/**
 * Returns the first character of the baby's name, used as the avatar initial.
 * Falls back to "👶" when name is empty.
 */
export function getBabyInitial(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return '👶';
  // Korean names are 1-char-per-syllable; first char works for both Hangul
  // and Latin alphabets (e.g., "Alex" → "A", "윤서아" → "윤").
  return trimmed.charAt(0);
}
