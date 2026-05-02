import { fireEvent, render, screen } from '@testing-library/react-native';

import { FAQS } from '@/data/faqs';

import { FAQSection } from './FAQSection';

describe('FAQSection', () => {
  it('renders the section header', () => {
    render(<FAQSection />);
    expect(screen.getByText('초보엄마 FAQ')).toBeTruthy();
    expect(screen.getByText('자주 묻는 질문')).toBeTruthy();
  });

  it('renders all 10 questions in collapsed state', () => {
    render(<FAQSection />);
    for (const faq of FAQS) {
      expect(screen.getByText(faq.question)).toBeTruthy();
    }
  });

  it('does not render any answer text by default', () => {
    render(<FAQSection />);
    for (const faq of FAQS) {
      expect(screen.queryByText(faq.answer)).toBeNull();
    }
  });

  it('expands a question when tapped', () => {
    render(<FAQSection />);
    const target = FAQS[0];
    fireEvent.press(screen.getByText(target.question));
    expect(screen.getByText(target.answer)).toBeTruthy();
  });

  it('collapses when the same question is tapped twice', () => {
    render(<FAQSection />);
    const target = FAQS[0];
    fireEvent.press(screen.getByText(target.question));
    fireEvent.press(screen.getByText(target.question));
    expect(screen.queryByText(target.answer)).toBeNull();
  });

  it('only allows one answer to be open at a time', () => {
    render(<FAQSection />);
    const a = FAQS[0];
    const b = FAQS[1];
    fireEvent.press(screen.getByText(a.question));
    fireEvent.press(screen.getByText(b.question));
    expect(screen.queryByText(a.answer)).toBeNull();
    expect(screen.getByText(b.answer)).toBeTruthy();
  });
});
