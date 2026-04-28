import {
  dayFraction,
  filterEventsForDay,
  MARKER_HOURS,
  type TimelineEvent,
} from './timelineEvents';

describe('dayFraction', () => {
  const day = new Date('2026-04-28T00:00:00');

  it('returns 0 at midnight start', () => {
    expect(dayFraction(new Date('2026-04-28T00:00:00'), day)).toBe(0);
  });

  it('returns 0.5 at noon', () => {
    expect(dayFraction(new Date('2026-04-28T12:00:00'), day)).toBeCloseTo(0.5, 4);
  });

  it('returns ~0.25 at 6am', () => {
    expect(dayFraction(new Date('2026-04-28T06:00:00'), day)).toBeCloseTo(0.25, 4);
  });

  it('clamps to 0 for events before the day', () => {
    expect(dayFraction(new Date('2026-04-27T18:00:00'), day)).toBe(0);
  });

  it('clamps to 1 for events after the day', () => {
    expect(dayFraction(new Date('2026-04-29T05:00:00'), day)).toBe(1);
  });

  it('returns near 1 just before midnight', () => {
    const v = dayFraction(new Date('2026-04-28T23:59:00'), day);
    expect(v).toBeGreaterThan(0.99);
    expect(v).toBeLessThan(1);
  });
});

describe('filterEventsForDay', () => {
  const day = new Date('2026-04-28T00:00:00');

  const events: TimelineEvent[] = [
    {
      id: '1',
      kind: 'feed',
      startedAt: new Date('2026-04-27T22:00:00'),
    }, // yesterday
    {
      id: '2',
      kind: 'feed',
      startedAt: new Date('2026-04-28T06:00:00'),
    }, // today
    {
      id: '3',
      kind: 'sleep',
      startedAt: new Date('2026-04-28T13:00:00'),
      endedAt: new Date('2026-04-28T15:00:00'),
    }, // today
    {
      id: '4',
      kind: 'feed',
      startedAt: new Date('2026-04-29T01:00:00'),
    }, // tomorrow
  ];

  it('includes events whose startedAt falls on the reference day', () => {
    const result = filterEventsForDay(events, day);
    expect(result.map((e) => e.id)).toEqual(['2', '3']);
  });

  it('returns empty array when no events match', () => {
    const future = new Date('2027-01-01T00:00:00');
    expect(filterEventsForDay(events, future)).toEqual([]);
  });
});

describe('MARKER_HOURS', () => {
  it('uses 3-hour intervals from 06 to 21', () => {
    expect(MARKER_HOURS).toEqual([6, 9, 12, 15, 18, 21]);
  });
});
