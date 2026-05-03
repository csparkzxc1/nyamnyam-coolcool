import { fireEvent, render, screen } from '@testing-library/react-native';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { FeedingTypeStep } from './FeedingTypeStep';

describe('FeedingTypeStep', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it('renders all 3 feeding methods + 4 last-feed quick picks', () => {
    render(<FeedingTypeStep onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('모유')).toBeTruthy();
    expect(screen.getByText('분유')).toBeTruthy();
    expect(screen.getByText('혼합')).toBeTruthy();
    expect(screen.getByText('방금')).toBeTruthy();
    expect(screen.getByText('30분 전')).toBeTruthy();
    expect(screen.getByText('1시간 전')).toBeTruthy();
    expect(screen.getByText('모름')).toBeTruthy();
  });

  it('writes the feeding method choice into the store', () => {
    render(<FeedingTypeStep onBack={() => {}} onNext={() => {}} />);
    fireEvent.press(screen.getByText('분유'));
    expect(useOnboardingStore.getState().feedingType).toBe('formula');
  });

  it('writes the last-feed choice into the store', () => {
    render(<FeedingTypeStep onBack={() => {}} onNext={() => {}} />);
    fireEvent.press(screen.getByText('30분 전'));
    expect(useOnboardingStore.getState().lastFeedChoice).toBe('30m-ago');
  });

  it('calls onNext / onBack handlers', () => {
    const onNext = jest.fn();
    const onBack = jest.fn();
    render(<FeedingTypeStep onBack={onBack} onNext={onNext} />);
    fireEvent.press(screen.getByLabelText('다음'));
    fireEvent.press(screen.getByLabelText('이전'));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
