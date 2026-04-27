import { render, screen } from '@testing-library/react-native';

import { NextActionCard } from './NextActionCard';

const baseProps = {
  label: 'test label',
  primary: 'test primary',
};

describe('NextActionCard', () => {
  describe('badge text per scenario', () => {
    it('shows "편안해요" for normal scenario', () => {
      render(<NextActionCard scenario="normal" {...baseProps} />);
      expect(screen.getByText('편안해요')).toBeTruthy();
    });

    it('shows "곧이에요" for warning scenario', () => {
      render(<NextActionCard scenario="warning" {...baseProps} />);
      expect(screen.getByText('곧이에요')).toBeTruthy();
    });

    it('shows "챙겨주세요" for alert scenario', () => {
      render(<NextActionCard scenario="alert" {...baseProps} />);
      expect(screen.getByText('챙겨주세요')).toBeTruthy();
    });

    it('shows "자는 중" for sleeping scenario', () => {
      render(<NextActionCard scenario="sleeping" {...baseProps} />);
      expect(screen.getByText('자는 중')).toBeTruthy();
    });
  });

  describe('text rendering', () => {
    it('renders label and primary text', () => {
      render(<NextActionCard scenario="normal" label="테스트 라벨" primary="테스트 본문" />);
      expect(screen.getByText('테스트 라벨')).toBeTruthy();
      expect(screen.getByText('테스트 본문')).toBeTruthy();
    });

    it('renders primaryEm when provided', () => {
      render(<NextActionCard scenario="normal" label="라벨" primary="본문" primaryEm="(부가)" />);
      expect(screen.getByText(/부가/)).toBeTruthy();
    });

    it('renders secondary when provided', () => {
      render(<NextActionCard scenario="normal" {...baseProps} secondary="마지막 수유 2시간 전" />);
      expect(screen.getByText('마지막 수유 2시간 전')).toBeTruthy();
    });
  });

  describe('confidence prop', () => {
    it('renders learning hint when confidence is "learning"', () => {
      render(<NextActionCard scenario="normal" confidence="learning" {...baseProps} />);
      expect(screen.getByText(/패턴 학습 중/)).toBeTruthy();
    });

    it('does not render learning hint when confidence is "high"', () => {
      render(<NextActionCard scenario="normal" confidence="high" {...baseProps} />);
      expect(screen.queryByText(/패턴 학습 중/)).toBeNull();
    });

    it('does not render learning hint when confidence is omitted', () => {
      render(<NextActionCard scenario="normal" {...baseProps} />);
      expect(screen.queryByText(/패턴 학습 중/)).toBeNull();
    });

    it('hides secondary when learning hint is shown', () => {
      render(
        <NextActionCard
          scenario="normal"
          confidence="learning"
          {...baseProps}
          secondary="이건 안 보여야 함"
        />,
      );
      expect(screen.queryByText('이건 안 보여야 함')).toBeNull();
    });
  });

  describe('optional props omitted', () => {
    it('renders without primaryEm', () => {
      render(<NextActionCard scenario="normal" {...baseProps} />);
      expect(screen.getByText('test label')).toBeTruthy();
    });

    it('renders without secondary', () => {
      render(<NextActionCard scenario="normal" {...baseProps} />);
      expect(screen.queryByText(/마지막/)).toBeNull();
    });
  });
});
