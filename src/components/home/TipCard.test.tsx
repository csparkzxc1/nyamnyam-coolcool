import { render, screen } from '@testing-library/react-native';

import { TipCard } from './TipCard';

describe('TipCard', () => {
  it('renders the label', () => {
    render(<TipCard label="오늘의 응원" message="잘하고 있어요." />);
    expect(screen.getByText('오늘의 응원')).toBeTruthy();
  });

  it('renders the message', () => {
    render(<TipCard label="응원" message="신생아의 하루는 길어요." />);
    expect(screen.getByText('신생아의 하루는 길어요.')).toBeTruthy();
  });

  it('renders the default 🌿 icon when no icon prop is given', () => {
    render(<TipCard label="응원" message="message" />);
    expect(screen.getByText('🌿')).toBeTruthy();
  });

  it('renders a custom icon when provided', () => {
    render(<TipCard label="응원" message="message" icon="☀️" />);
    expect(screen.getByText('☀️')).toBeTruthy();
  });

  it('does not render the default icon when a custom icon is given', () => {
    render(<TipCard label="응원" message="message" icon="✨" />);
    expect(screen.queryByText('🌿')).toBeNull();
  });

  it('preserves multi-line messages', () => {
    const multiLine = '첫 줄\n둘째 줄\n셋째 줄';
    render(<TipCard label="응원" message={multiLine} />);
    expect(screen.getByText(multiLine)).toBeTruthy();
  });
});
