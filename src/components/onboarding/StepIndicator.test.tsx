import { render, screen } from '@testing-library/react-native';

import { StepIndicator } from './StepIndicator';

describe('StepIndicator', () => {
  it('renders the "current / total" counter', () => {
    render(<StepIndicator current={3} total={5} />);
    expect(screen.getByText('3 / 5')).toBeTruthy();
  });

  it('handles step=1', () => {
    render(<StepIndicator current={1} total={5} />);
    expect(screen.getByText('1 / 5')).toBeTruthy();
  });

  it('handles the final step', () => {
    render(<StepIndicator current={5} total={5} />);
    expect(screen.getByText('5 / 5')).toBeTruthy();
  });
});
