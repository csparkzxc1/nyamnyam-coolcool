import { fireEvent, render, screen } from '@testing-library/react-native';

import { SLEEP_CUES } from '@/data/sleepCues';

import { SleepCueGuide } from './SleepCueGuide';

describe('SleepCueGuide', () => {
  it('renders the section header', () => {
    render(<SleepCueGuide />);
    expect(screen.getByText('졸림 신호 6가지')).toBeTruthy();
    expect(screen.getByText('교육 콘텐츠')).toBeTruthy();
  });

  it('renders all 6 cue titles by default', () => {
    render(<SleepCueGuide />);
    for (const cue of SLEEP_CUES) {
      expect(screen.getByText(cue.title)).toBeTruthy();
    }
  });

  it('hides description text until a card is tapped', () => {
    render(<SleepCueGuide />);
    const firstCue = SLEEP_CUES[0];
    expect(screen.queryByText(firstCue.description)).toBeNull();
  });

  it('expands the description when the card is pressed', () => {
    render(<SleepCueGuide />);
    const firstCue = SLEEP_CUES[0];
    fireEvent.press(screen.getByText(firstCue.title));
    expect(screen.getByText(firstCue.description)).toBeTruthy();
  });

  it('collapses the description when the same card is pressed twice', () => {
    render(<SleepCueGuide />);
    const firstCue = SLEEP_CUES[0];
    fireEvent.press(screen.getByText(firstCue.title));
    fireEvent.press(screen.getByText(firstCue.title));
    expect(screen.queryByText(firstCue.description)).toBeNull();
  });

  it('only one card is expanded at a time', () => {
    render(<SleepCueGuide />);
    const cueA = SLEEP_CUES[0];
    const cueB = SLEEP_CUES[1];
    fireEvent.press(screen.getByText(cueA.title));
    fireEvent.press(screen.getByText(cueB.title));
    expect(screen.queryByText(cueA.description)).toBeNull();
    expect(screen.getByText(cueB.description)).toBeTruthy();
  });

  it('shows the overtired warning copy', () => {
    render(<SleepCueGuide />);
    expect(screen.getByText(/과각성/)).toBeTruthy();
  });
});
