import {
  isStep2Valid,
  lastFeedAtFromChoice,
  useOnboardingStore,
} from './onboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it('starts with empty Step 2 fields and a "mixed" feeding default', () => {
    const s = useOnboardingStore.getState();
    expect(s.name).toBe('');
    expect(s.birthDate).toBeNull();
    expect(s.gender).toBeNull();
    expect(s.feedingType).toBe('mixed');
    expect(s.notificationsEnabled).toBe(true);
    expect(s.tone).toBe('chime');
  });

  it('setBabyInfo merges only the provided fields', () => {
    useOnboardingStore.getState().setBabyInfo({ name: '서아' });
    expect(useOnboardingStore.getState().name).toBe('서아');
    expect(useOnboardingStore.getState().birthDate).toBeNull();
    useOnboardingStore.getState().setBabyInfo({ birthDate: new Date('2026-04-01') });
    expect(useOnboardingStore.getState().name).toBe('서아');
    expect(useOnboardingStore.getState().birthDate?.getFullYear()).toBe(2026);
  });

  it('reset clears every field back to the initial values', () => {
    const s = useOnboardingStore.getState();
    s.setBabyInfo({ name: 'X', gender: 'female' });
    s.setFeedingType('formula');
    s.setLastFeedChoice('30m-ago');
    s.setNotificationsEnabled(false);
    s.setTone('silent');
    s.acknowledgeStep5();
    s.reset();
    const after = useOnboardingStore.getState();
    expect(after.name).toBe('');
    expect(after.gender).toBeNull();
    expect(after.feedingType).toBe('mixed');
    expect(after.lastFeedChoice).toBeNull();
    expect(after.notificationsEnabled).toBe(true);
    expect(after.tone).toBe('chime');
    expect(after.step5AcknowledgedAt).toBeNull();
  });
});

describe('isStep2Valid', () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60_000);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60_000);

  it('returns false when name is empty', () => {
    expect(
      isStep2Valid({ name: '   ', birthDate: yesterday, gender: 'male' }),
    ).toBe(false);
  });

  it('returns false when birthDate is missing', () => {
    expect(
      isStep2Valid({ name: '서아', birthDate: null, gender: 'male' }),
    ).toBe(false);
  });

  it('returns false when birthDate is in the future', () => {
    expect(
      isStep2Valid({ name: '서아', birthDate: tomorrow, gender: 'male' }),
    ).toBe(false);
  });

  it('returns false when gender is null', () => {
    expect(
      isStep2Valid({ name: '서아', birthDate: yesterday, gender: null }),
    ).toBe(false);
  });

  it('returns true when every field is filled correctly', () => {
    expect(
      isStep2Valid({ name: '서아', birthDate: yesterday, gender: 'female' }),
    ).toBe(true);
  });
});

describe('lastFeedAtFromChoice', () => {
  const now = new Date('2026-05-02T15:00:00');

  it('returns now for "just-now"', () => {
    const r = lastFeedAtFromChoice('just-now', now);
    expect(r?.getTime()).toBe(now.getTime());
  });

  it('returns 30 min ago for "30m-ago"', () => {
    const r = lastFeedAtFromChoice('30m-ago', now);
    expect(now.getTime() - (r?.getTime() ?? 0)).toBe(30 * 60_000);
  });

  it('returns 1 hour ago for "1h-ago"', () => {
    const r = lastFeedAtFromChoice('1h-ago', now);
    expect(now.getTime() - (r?.getTime() ?? 0)).toBe(60 * 60_000);
  });

  it('returns null for "unknown" or null', () => {
    expect(lastFeedAtFromChoice('unknown', now)).toBeNull();
    expect(lastFeedAtFromChoice(null, now)).toBeNull();
  });
});
