import { fireEvent, render, screen } from '@testing-library/react-native';

import { WelcomeStep } from './WelcomeStep';

describe('WelcomeStep', () => {
  it('renders the welcome headline', () => {
    render(<WelcomeStep onNext={() => {}} />);
    expect(screen.getByText(/오신 걸 환영해요/)).toBeTruthy();
  });

  it('calls onNext when the CTA is pressed', () => {
    const onNext = jest.fn();
    render(<WelcomeStep onNext={onNext} />);
    fireEvent.press(screen.getByLabelText('시작하기'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
