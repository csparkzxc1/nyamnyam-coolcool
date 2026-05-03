import { fireEvent, render, screen } from '@testing-library/react-native';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { BabyInfoStep } from './BabyInfoStep';

describe('BabyInfoStep', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it('renders the screen header', () => {
    render(<BabyInfoStep onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('우리 아기를 알려주세요')).toBeTruthy();
  });

  it('disables the next button until name + birthDate + gender are set', () => {
    const onNext = jest.fn();
    render(<BabyInfoStep onBack={() => {}} onNext={onNext} />);
    fireEvent.press(screen.getByLabelText('다음'));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('writes name input changes into the store', () => {
    render(<BabyInfoStep onBack={() => {}} onNext={() => {}} />);
    fireEvent.changeText(screen.getByLabelText('아기 이름'), '윤서아');
    expect(useOnboardingStore.getState().name).toBe('윤서아');
  });

  it('selects gender via the gender buttons', () => {
    render(<BabyInfoStep onBack={() => {}} onNext={() => {}} />);
    fireEvent.press(screen.getByText('여아'));
    expect(useOnboardingStore.getState().gender).toBe('female');
  });

  it('calls onBack when 이전 is pressed', () => {
    const onBack = jest.fn();
    render(<BabyInfoStep onBack={onBack} onNext={() => {}} />);
    fireEvent.press(screen.getByLabelText('이전'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('enables 다음 button after the required fields are filled', () => {
    const onNext = jest.fn();
    // Pre-populate the store as if the user filled the form.
    useOnboardingStore.getState().setBabyInfo({
      name: '서아',
      birthDate: new Date('2026-04-01'),
      gender: 'female',
    });
    render(<BabyInfoStep onBack={() => {}} onNext={onNext} />);
    fireEvent.press(screen.getByLabelText('다음'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
