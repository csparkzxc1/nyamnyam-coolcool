import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';

import type { DetailedEvent } from '@/features/logging/eventsTransform';

import { RecordTimelineList } from './RecordTimelineList';

// ============================================================
// Test fixtures
// ============================================================

// Anchored on a Wednesday (2026-04-29) for predictable weekday labels.
const TODAY = new Date(2026, 3, 29, 15, 0, 0); // April = month index 3
const YESTERDAY = new Date(2026, 3, 28, 15, 0, 0);
const TWO_DAYS_AGO = new Date(2026, 3, 27, 15, 0, 0);

const at = (date: Date, h: number, m: number) => {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

const diaper = (id: string, date: Date, h: number, m: number): DetailedEvent => ({
  kind: 'diaper',
  id,
  startedAt: at(date, h, m),
  type: 'wet',
});

// ============================================================
// Tests
// ============================================================

describe('RecordTimelineList', () => {
  describe('header', () => {
    it("labels today as '오늘'", () => {
      const { getByText } = render(<RecordTimelineList events={[]} date={TODAY} now={TODAY} />);
      expect(getByText(/오늘/)).toBeTruthy();
    });

    it("labels yesterday as '어제'", () => {
      const { getByText } = render(<RecordTimelineList events={[]} date={YESTERDAY} now={TODAY} />);
      expect(getByText(/어제/)).toBeTruthy();
    });

    it('labels older days as "M월 D일 (요일)"', () => {
      const { getByText } = render(
        <RecordTimelineList events={[]} date={TWO_DAYS_AGO} now={TODAY} />,
      );
      // 2026-04-27 was a Monday in this calendar
      expect(getByText('4월 27일 (월)')).toBeTruthy();
    });

    it('shows the count when there are events', () => {
      const events: DetailedEvent[] = [
        diaper('d1', TODAY, 10, 0),
        diaper('d2', TODAY, 11, 0),
        diaper('d3', TODAY, 12, 0),
      ];
      const { getByText } = render(<RecordTimelineList events={events} date={TODAY} now={TODAY} />);
      expect(getByText('3개')).toBeTruthy();
    });

    it('hides the count when empty', () => {
      const { queryByText } = render(<RecordTimelineList events={[]} date={TODAY} now={TODAY} />);
      expect(queryByText(/0개/)).toBeNull();
      expect(queryByText('개')).toBeNull();
    });
  });

  describe('empty state', () => {
    it('renders the empty message when events is []', () => {
      const { getByText } = render(<RecordTimelineList events={[]} date={TODAY} now={TODAY} />);
      expect(getByText('기록이 없어요')).toBeTruthy();
    });

    it('does not render the empty message when events exist', () => {
      const { queryByText } = render(
        <RecordTimelineList events={[diaper('d1', TODAY, 10, 0)]} date={TODAY} now={TODAY} />,
      );
      expect(queryByText('기록이 없어요')).toBeNull();
    });
  });

  describe('ordering', () => {
    it('sorts events newest first regardless of input order', () => {
      const events: DetailedEvent[] = [
        diaper('d-old', TODAY, 8, 0),
        diaper('d-new', TODAY, 14, 0),
        diaper('d-mid', TODAY, 11, 0),
      ];
      const { getAllByText } = render(
        <RecordTimelineList events={events} date={TODAY} now={TODAY} />,
      );
      // The HH:mm strings appear in newest-first order in the rendered tree.
      const times = getAllByText(/^\d{2}:\d{2}$/).map((node) => node.props.children);
      expect(times).toEqual(['14:00', '11:00', '08:00']);
    });

    it('does not mutate the caller events array', () => {
      const events: DetailedEvent[] = [diaper('d-old', TODAY, 8, 0), diaper('d-new', TODAY, 14, 0)];
      const before = events.map((e) => e.id);
      render(<RecordTimelineList events={events} date={TODAY} now={TODAY} />);
      expect(events.map((e) => e.id)).toEqual(before);
    });
  });
});
