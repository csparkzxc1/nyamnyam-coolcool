import { fireEvent, render, screen } from '@testing-library/react-native';

import { BabyProfileHeader } from './BabyProfileHeader';

const baseProps = {
  name: '윤서아',
  birthDate: new Date('2026-03-12T00:00:00'),
  now: new Date('2026-04-28T00:00:00'),
};

describe('BabyProfileHeader', () => {
  describe('rendering', () => {
    it('renders the baby name', () => {
      render(<BabyProfileHeader {...baseProps} />);
      expect(screen.getByText('윤서아')).toBeTruthy();
    });

    it('renders the formatted age in the new D+ format', () => {
      render(<BabyProfileHeader {...baseProps} />);
      expect(screen.getByText('1개월 16일 (D+047)')).toBeTruthy();
    });

    it('renders the avatar initial (first character of name)', () => {
      render(<BabyProfileHeader {...baseProps} />);
      expect(screen.getByText('윤')).toBeTruthy();
    });
  });

  describe('caregiver badge', () => {
    it('hides badge when caregiverCount is undefined', () => {
      render(<BabyProfileHeader {...baseProps} />);
      expect(screen.queryByText(/명/)).toBeNull();
    });

    it('hides badge when caregiverCount is 1', () => {
      render(<BabyProfileHeader {...baseProps} caregiverCount={1} />);
      expect(screen.queryByText(/명/)).toBeNull();
    });

    it('shows badge when caregiverCount is 2', () => {
      render(<BabyProfileHeader {...baseProps} caregiverCount={2} />);
      expect(screen.getByText('2명')).toBeTruthy();
    });

    it('shows badge when caregiverCount is greater than 2', () => {
      render(<BabyProfileHeader {...baseProps} caregiverCount={4} />);
      expect(screen.getByText('4명')).toBeTruthy();
    });
  });

  describe('newborn (under 1 month)', () => {
    it('shows "생후 N일 (D+NNN)" format for under-1-month baby', () => {
      render(
        <BabyProfileHeader
          name="준"
          birthDate={new Date('2026-04-15T00:00:00')}
          now={new Date('2026-04-28T00:00:00')}
        />,
      );
      expect(screen.getByText('생후 13일 (D+013)')).toBeTruthy();
    });
  });

  describe('callbacks', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<BabyProfileHeader {...baseProps} onPress={onPress} />);
      fireEvent.press(screen.getByText('윤서아'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onPress is omitted and pressed', () => {
      render(<BabyProfileHeader {...baseProps} />);
      expect(() => fireEvent.press(screen.getByText('윤서아'))).not.toThrow();
    });
  });
});
