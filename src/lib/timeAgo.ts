import { differenceInMinutes } from 'date-fns';

/**
 * Returns a Korean "time ago" string: "방금", "3분 전", "2시간 25분 전",
 * "어제", "N일 전".
 *
 * Designed for the home screen's QuickLogGrid where the format must be
 * compact and parseable at a glance. Hours+minutes is shown together so
 * caregivers don't have to mentally convert "150분 전" into "2.5시간".
 */
export function formatTimeAgo(at: Date, now: Date = new Date()): string {
  const totalMinutes = differenceInMinutes(now, at);

  if (totalMinutes < 0) return '방금'; // future / clock skew
  if (totalMinutes < 1) return '방금';
  if (totalMinutes < 60) return `${totalMinutes}분 전`;

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (totalHours < 24) {
    if (remainingMinutes === 0) return `${totalHours}시간 전`;
    return `${totalHours}시간 ${remainingMinutes}분 전`;
  }

  const days = Math.floor(totalHours / 24);
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  // Beyond a week, fall back to a simple day count. The home screen rarely
  // shows events older than this — old events live on the Timeline tab.
  return `${days}일 전`;
}
