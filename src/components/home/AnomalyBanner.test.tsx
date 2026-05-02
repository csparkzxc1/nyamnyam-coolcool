import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Anomaly } from '@/features/anomalies/detect';

import { AnomalyBanner } from './AnomalyBanner';

const warning: Anomaly = {
  code: 'OVERFEEDING_RISK',
  severity: 'warning',
  message: '오늘 분유량이 1100ml예요',
  detail: '1일 권장 상한을 넘었어요. 자세한 안내 메시지...',
  data: { todayMl: 1100 },
};

const critical: Anomaly = {
  code: 'LOW_DIAPER_COUNT',
  severity: 'critical',
  message: '24시간 소변 기저귀 3장',
  detail: '탈수 위험 신호일 수 있어요',
  data: { wetCount: 3 },
};

describe('AnomalyBanner', () => {
  it('renders the message and severity label', () => {
    render(<AnomalyBanner anomaly={warning} onDismiss={() => {}} />);
    expect(screen.getByText('오늘 분유량이 1100ml예요')).toBeTruthy();
    expect(screen.getByText('확인')).toBeTruthy();
  });

  it('shows the dismiss X for non-critical anomalies', () => {
    render(<AnomalyBanner anomaly={warning} onDismiss={() => {}} />);
    expect(screen.getByLabelText('알림 닫기')).toBeTruthy();
  });

  it('hides the dismiss X for critical anomalies', () => {
    render(<AnomalyBanner anomaly={critical} onDismiss={() => {}} />);
    expect(screen.queryByLabelText('알림 닫기')).toBeNull();
  });

  it('calls onDismiss when X is pressed', () => {
    const onDismiss = jest.fn();
    render(<AnomalyBanner anomaly={warning} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByLabelText('알림 닫기'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('opens the detail modal when banner body is tapped', () => {
    render(<AnomalyBanner anomaly={warning} onDismiss={() => {}} />);
    expect(screen.queryByText(warning.detail)).toBeNull();
    fireEvent.press(screen.getByLabelText(/자세히 보기/));
    expect(screen.getByText(warning.detail)).toBeTruthy();
  });

  it('closes the detail modal via the confirm button', () => {
    render(<AnomalyBanner anomaly={warning} onDismiss={() => {}} />);
    fireEvent.press(screen.getByLabelText(/자세히 보기/));
    fireEvent.press(screen.getByLabelText('확인하고 닫기'));
    expect(screen.queryByText(warning.detail)).toBeNull();
  });
});
