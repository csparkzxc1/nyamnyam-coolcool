import { fireEvent, render, screen } from '@testing-library/react-native';

import { QuickLogButton } from './QuickLogButton';

const noop = () => {};

describe('QuickLogButton', () => {
  describe('label per kind', () => {
    it('shows "수유" for feed kind', () => {
      render(<QuickLogButton kind="feed" isActive={false} onPress={noop} />);
      expect(screen.getByText('수유')).toBeTruthy();
    });

    it('shows "수면" for sleep kind', () => {
      render(<QuickLogButton kind="sleep" isActive={false} onPress={noop} />);
      expect(screen.getByText('수면')).toBeTruthy();
    });

    it('shows "기저귀" for diaper kind', () => {
      render(<QuickLogButton kind="diaper" isActive={false} onPress={noop} />);
      expect(screen.getByText('기저귀')).toBeTruthy();
    });

    it('shows "목욕" for bath kind', () => {
      render(<QuickLogButton kind="bath" isActive={false} onPress={noop} />);
      expect(screen.getByText('목욕')).toBeTruthy();
    });
  });

  describe('active state', () => {
    it('shows "진행 중" label when active', () => {
      render(<QuickLogButton kind="feed" isActive activeTimer="00:35" onPress={noop} />);
      expect(screen.getByText('진행 중')).toBeTruthy();
    });

    it('shows activeTimer when active', () => {
      render(<QuickLogButton kind="feed" isActive activeTimer="01:23" onPress={noop} />);
      expect(screen.getByText('01:23')).toBeTruthy();
    });

    it('falls back to "00:00" when active but timer is missing', () => {
      render(<QuickLogButton kind="feed" isActive onPress={noop} />);
      expect(screen.getByText('00:00')).toBeTruthy();
    });

    it('hides kind label when active', () => {
      render(<QuickLogButton kind="feed" isActive activeTimer="00:35" onPress={noop} />);
      expect(screen.queryByText('수유')).toBeNull();
    });
  });

  describe('inactive state', () => {
    it('shows lastAtText when provided', () => {
      render(
        <QuickLogButton kind="feed" isActive={false} lastAtText="2시간 25분 전" onPress={noop} />,
      );
      expect(screen.getByText('2시간 25분 전')).toBeTruthy();
    });

    it('falls back to "처음" when lastAtText is missing', () => {
      render(<QuickLogButton kind="feed" isActive={false} onPress={noop} />);
      expect(screen.getByText('처음')).toBeTruthy();
    });

    it('shows subtitle when provided', () => {
      render(
        <QuickLogButton kind="feed" isActive={false} subtitle="120ml · 분유" onPress={noop} />,
      );
      expect(screen.getByText('120ml · 분유')).toBeTruthy();
    });
  });

  describe('callbacks', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<QuickLogButton kind="feed" isActive={false} onPress={onPress} />);
      fireEvent.press(screen.getByText('수유'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
