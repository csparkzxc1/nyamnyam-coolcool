import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';

import type { DailySummary } from '@/features/logging/summarizeEvents';

import { DailySummaryRow } from './DailySummaryRow';

const empty: DailySummary = {
  feedCount: 0,
  feedAmountMl: 0,
  sleepMinutes: 0,
  diaperCount: 0,
  bathCount: 0,
};

describe('DailySummaryRow', () => {
  it('renders nothing when all counts are zero', () => {
    const { toJSON } = render(<DailySummaryRow summary={empty} />);
    expect(toJSON()).toBeNull();
  });

  it('renders feed with ml and count', () => {
    const { getByText } = render(
      <DailySummaryRow summary={{ ...empty, feedCount: 3, feedAmountMl: 240 }} />,
    );
    expect(getByText('🍼 240ml (3회)')).toBeTruthy();
  });

  it('renders feed without ml when amount is 0 (e.g. breastfeeding only)', () => {
    const { getByText, queryByText } = render(
      <DailySummaryRow summary={{ ...empty, feedCount: 4, feedAmountMl: 0 }} />,
    );
    expect(getByText('🍼 4회')).toBeTruthy();
    expect(queryByText(/ml/)).toBeNull();
  });

  it('renders sleep with hours and minutes', () => {
    const { getByText } = render(<DailySummaryRow summary={{ ...empty, sleepMinutes: 270 }} />);
    expect(getByText('😴 4시간 30분')).toBeTruthy();
  });

  it('renders diaper and bath counts', () => {
    const { getByText } = render(
      <DailySummaryRow summary={{ ...empty, diaperCount: 5, bathCount: 1 }} />,
    );
    expect(getByText(/💧 5회/)).toBeTruthy();
    expect(getByText(/🛁 1회/)).toBeTruthy();
  });

  it('joins multiple parts with " · "', () => {
    const { getByText } = render(
      <DailySummaryRow
        summary={{
          feedCount: 3,
          feedAmountMl: 240,
          sleepMinutes: 270,
          diaperCount: 5,
          bathCount: 1,
        }}
      />,
    );
    expect(getByText('🍼 240ml (3회) · 😴 4시간 30분 · 💧 5회 · 🛁 1회')).toBeTruthy();
  });

  it('skips zero-count fields entirely (no "0회" strings)', () => {
    const { getByText, queryByText } = render(
      <DailySummaryRow summary={{ ...empty, feedCount: 3, feedAmountMl: 240 }} />,
    );
    expect(getByText('🍼 240ml (3회)')).toBeTruthy();
    expect(queryByText(/0회/)).toBeNull();
    expect(queryByText(/💧/)).toBeNull();
    expect(queryByText(/🛁/)).toBeNull();
    expect(queryByText(/😴/)).toBeNull();
  });
});
