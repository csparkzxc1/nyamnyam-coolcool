import { formatTimeAgo } from './timeAgo';

describe('formatTimeAgo', () => {
  const now = new Date('2026-04-28T15:00:00');

  it('returns "방금" for events under a minute ago', () => {
    expect(formatTimeAgo(new Date('2026-04-28T14:59:30'), now)).toBe('방금');
  });

  it('returns "방금" for future events (clock skew safe)', () => {
    expect(formatTimeAgo(new Date('2026-04-28T15:05:00'), now)).toBe('방금');
  });

  it('returns "N분 전" under one hour', () => {
    expect(formatTimeAgo(new Date('2026-04-28T14:35:00'), now)).toBe('25분 전');
  });

  it('returns "N시간 전" on the hour', () => {
    expect(formatTimeAgo(new Date('2026-04-28T13:00:00'), now)).toBe('2시간 전');
  });

  it('returns "N시간 N분 전" with both', () => {
    expect(formatTimeAgo(new Date('2026-04-28T12:35:00'), now)).toBe('2시간 25분 전');
  });

  it('returns "어제" for events 1 day ago', () => {
    expect(formatTimeAgo(new Date('2026-04-27T15:00:00'), now)).toBe('어제');
  });

  it('returns "N일 전" for events 2-6 days ago', () => {
    expect(formatTimeAgo(new Date('2026-04-25T15:00:00'), now)).toBe('3일 전');
  });

  it('still works beyond a week', () => {
    expect(formatTimeAgo(new Date('2026-04-15T15:00:00'), now)).toBe('13일 전');
  });
});
