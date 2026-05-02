import { render, screen } from '@testing-library/react-native';

import { PersonalComparisonCard } from './PersonalComparisonCard';

const standardRange = { min: 120, max: 180 };
const formatRange = (r: { min: number; max: number }) => `${r.min}~${r.max}분`;
const formatPersonal = (n: number) => `${n}분`;

describe('PersonalComparisonCard', () => {
  it('renders the eyebrow and title', () => {
    render(<PersonalComparisonCard rows={[]} />);
    expect(screen.getByText('최근 7일')).toBeTruthy();
    expect(screen.getByText('우리 아이 vs 평균')).toBeTruthy();
  });

  it('renders the personal value and standard range when data is sufficient', () => {
    render(
      <PersonalComparisonCard
        rows={[
          {
            label: '평균 수유 간격',
            personal: 150,
            formatPersonal,
            standardRange,
            formatRange,
            bucket: 'within',
            sampleCount: 10,
            minSamples: 4,
          },
        ]}
      />,
    );
    expect(screen.getByText('평균 수유 간격')).toBeTruthy();
    expect(screen.getByText('150분')).toBeTruthy();
    expect(screen.getByText('· 표준 120~180분')).toBeTruthy();
    expect(screen.getByText('표준 범위')).toBeTruthy();
  });

  it('shows "패턴 학습 중" copy when sample count is below threshold', () => {
    render(
      <PersonalComparisonCard
        rows={[
          {
            label: '평균 수유 간격',
            personal: 150,
            formatPersonal,
            standardRange,
            formatRange,
            bucket: 'within',
            sampleCount: 1,
            minSamples: 4,
          },
        ]}
      />,
    );
    expect(screen.getByText('패턴 학습 중')).toBeTruthy();
    // Tone badge label should NOT show when learning
    expect(screen.queryByText('표준 범위')).toBeNull();
  });

  it('renders a dash when there is no personal value yet', () => {
    render(
      <PersonalComparisonCard
        rows={[
          {
            label: '하루 평균 수면 시간',
            personal: null,
            formatPersonal: (n) => `${n}시간`,
            standardRange: { min: 14, max: 17 },
            formatRange: (r) => `${r.min}~${r.max}시간`,
            bucket: null,
            sampleCount: 0,
            minSamples: 3,
          },
        ]}
      />,
    );
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText('패턴 학습 중')).toBeTruthy();
  });

  it('renders a "low" badge when the personal value sits below the standard', () => {
    render(
      <PersonalComparisonCard
        rows={[
          {
            label: '평균 수유 간격',
            personal: 90,
            formatPersonal,
            standardRange,
            formatRange,
            bucket: 'low',
            sampleCount: 8,
            minSamples: 4,
          },
        ]}
      />,
    );
    expect(screen.getByText('표준보다 짧음')).toBeTruthy();
  });
});
