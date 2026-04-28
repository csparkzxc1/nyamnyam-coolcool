import { render, screen } from '@testing-library/react-native';

import type { TimelineEvent } from '@/lib/timelineEvents';

import { Timeline } from './Timeline';

const now = new Date('2026-04-28T15:42:00');
const day = new Date('2026-04-28T00:00:00');

const sampleEvents: TimelineEvent[] = [
  { id: '1', kind: 'feed', startedAt: new Date('2026-04-28T06:00:00') },
  { id: '2', kind: 'feed', startedAt: new Date('2026-04-28T10:30:00') },
  {
    id: '3',
    kind: 'sleep',
    startedAt: new Date('2026-04-28T08:00:00'),
    endedAt: new Date('2026-04-28T10:00:00'),
  },
  { id: '4', kind: 'diaper', startedAt: new Date('2026-04-28T07:30:00') },
  { id: '5', kind: 'bath', startedAt: new Date('2026-04-28T17:00:00') },
];

describe('Timeline', () => {
  it('renders the header label', () => {
    render(<Timeline events={[]} now={now} referenceDay={day} />);
    expect(screen.getByText('TODAY · 24h')).toBeTruthy();
  });

  it('renders the current time in HH:MM format', () => {
    render(<Timeline events={[]} now={now} referenceDay={day} />);
    expect(screen.getByText('15:42')).toBeTruthy();
  });

  it('renders all four kind labels', () => {
    render(<Timeline events={[]} now={now} referenceDay={day} />);
    expect(screen.getByText('수유')).toBeTruthy();
    expect(screen.getByText('수면')).toBeTruthy();
    expect(screen.getByText('기저귀')).toBeTruthy();
    expect(screen.getByText('목욕')).toBeTruthy();
  });

  it('renders all hour markers (06, 09, 12, 15, 18, 21)', () => {
    render(<Timeline events={[]} now={now} referenceDay={day} />);
    expect(screen.getByText('06')).toBeTruthy();
    expect(screen.getByText('09')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
    expect(screen.getByText('21')).toBeTruthy();
  });

  it('does not throw when given a large number of events', () => {
    const many: TimelineEvent[] = Array.from({ length: 150 }, (_, i) => ({
      id: `e${i}`,
      kind: 'feed',
      startedAt: new Date(`2026-04-28T${String(i % 24).padStart(2, '0')}:00:00`),
    }));
    expect(() => render(<Timeline events={many} now={now} referenceDay={day} />)).not.toThrow();
  });

  it('does not throw when given an empty event list', () => {
    expect(() => render(<Timeline events={[]} now={now} referenceDay={day} />)).not.toThrow();
  });

  it('does not throw when events fall outside the reference day', () => {
    const outOfRange: TimelineEvent[] = [
      { id: 'x', kind: 'feed', startedAt: new Date('2026-04-27T10:00:00') },
      { id: 'y', kind: 'feed', startedAt: new Date('2026-04-29T10:00:00') },
    ];
    expect(() =>
      render(<Timeline events={outOfRange} now={now} referenceDay={day} />),
    ).not.toThrow();
  });

  it('uses now as referenceDay when referenceDay is omitted', () => {
    expect(() => render(<Timeline events={sampleEvents} now={now} />)).not.toThrow();
  });
});
