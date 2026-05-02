import { FAQS } from './faqs';

describe('FAQS', () => {
  it('contains 10 entries per IMPLEMENTATION_PLAN T703', () => {
    expect(FAQS).toHaveLength(10);
  });

  it('uses unique ids — required for accordion state', () => {
    const ids = FAQS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a non-empty question and answer', () => {
    for (const faq of FAQS) {
      expect(faq.question.length).toBeGreaterThan(0);
      expect(faq.answer.length).toBeGreaterThan(0);
    }
  });

  it('answers prefer non-clinical observational language (no "정상/비정상" diagnosis)', () => {
    // CLAUDE.md §11.9 forbids "정상/비정상" wording in our copy. The
    // question can ask "정상인가요?" but the answer must not declare it.
    for (const faq of FAQS) {
      expect(faq.answer).not.toMatch(/비정상/);
    }
  });

  it('parent-fatigue answer surfaces the 1577-0199 helpline (CLAUDE.md §11)', () => {
    const fatigue = FAQS.find((f) => f.id === 'parent-fatigue');
    expect(fatigue?.answer).toContain('1577-0199');
  });
});
