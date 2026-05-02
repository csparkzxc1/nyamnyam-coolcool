import { createInMemoryScheduler } from './inMemoryScheduler';
import {
  getScheduler,
  installScheduler,
  syncReminders,
} from './runtime';
import { DEFAULT_SETTINGS } from './scheduler';

describe('runtime scheduler', () => {
  it('returns an in-memory scheduler when nothing is installed', () => {
    // First call should create a default in-memory scheduler.
    const s = getScheduler();
    expect(typeof s.schedule).toBe('function');
  });

  it('installScheduler swaps in a custom adapter', async () => {
    const custom = createInMemoryScheduler();
    installScheduler(custom);
    expect(getScheduler()).toBe(custom);
  });
});

describe('syncReminders', () => {
  beforeEach(() => {
    installScheduler(createInMemoryScheduler());
  });

  it('schedules every reminder produced by the builders', async () => {
    const now = new Date('2026-05-02T14:00:00');
    await syncReminders({
      babyName: '윤서아',
      ageMonths: 1,
      nextFeedAt: new Date('2026-05-02T15:00:00'),
      lastFeedAt: new Date('2026-05-02T13:00:00'),
      nextSleepAt: new Date('2026-05-02T15:30:00'),
      anomalies: [],
      settings: DEFAULT_SETTINGS,
      now,
    });
    const all = await getScheduler().list();
    const ids = all.map((n) => n.id);
    expect(ids).toContain('feed-reminder');
    expect(ids).toContain('sleep-cue-reminder');
    expect(ids).toContain('feed-4h-warning');
  });

  it('cancels everything when the master switch is off', async () => {
    const now = new Date('2026-05-02T14:00:00');
    await syncReminders({
      babyName: '윤서아',
      ageMonths: 1,
      nextFeedAt: new Date('2026-05-02T15:00:00'),
      lastFeedAt: new Date('2026-05-02T13:00:00'),
      nextSleepAt: new Date('2026-05-02T15:30:00'),
      anomalies: [],
      settings: { ...DEFAULT_SETTINGS, enabled: false },
      now,
    });
    const all = await getScheduler().list();
    expect(all).toHaveLength(0);
  });
});
