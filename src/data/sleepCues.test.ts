import { SLEEP_CUE_OVERTIRED_WARNING, SLEEP_CUES } from './sleepCues';

describe('SLEEP_CUES', () => {
  it('contains exactly the 6 cues from PRD §4.4', () => {
    expect(SLEEP_CUES).toHaveLength(6);
  });

  it('uses unique ids — required for React keys and tests', () => {
    const ids = SLEEP_CUES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every cue has a non-empty title, description, and icon', () => {
    for (const cue of SLEEP_CUES) {
      expect(cue.title.length).toBeGreaterThan(0);
      expect(cue.description.length).toBeGreaterThan(0);
      expect(cue.icon.length).toBeGreaterThan(0);
    }
  });

  it('exposes the overtired warning copy', () => {
    expect(SLEEP_CUE_OVERTIRED_WARNING).toContain('과각성');
  });
});
