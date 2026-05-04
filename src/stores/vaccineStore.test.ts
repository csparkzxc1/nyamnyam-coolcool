/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { beforeEach, describe, expect, it } from '@jest/globals';

import { useVaccineStore } from './vaccineStore';

beforeEach(() => {
  // Reset the store to its initial state between tests.
  useVaccineStore.setState({ completions: {} });
});

describe('vaccineStore', () => {
  describe('markCompleted', () => {
    it('adds a completion entry keyed by baby + dose', () => {
      const at = new Date('2026-01-15T10:00:00Z');
      useVaccineStore.getState().markCompleted('baby-1', 'bcg-1', at);
      const c = useVaccineStore.getState().completions;
      expect(c['baby-1:bcg-1']).toMatchObject({
        babyId: 'baby-1',
        doseId: 'bcg-1',
        completedAt: at.toISOString(),
      });
    });

    it('preserves entries for other babies and other doses', () => {
      useVaccineStore.getState().markCompleted('baby-1', 'bcg-1', new Date());
      useVaccineStore.getState().markCompleted('baby-2', 'bcg-1', new Date());
      useVaccineStore.getState().markCompleted('baby-1', 'hepb-1', new Date());

      const c = useVaccineStore.getState().completions;
      expect(Object.keys(c)).toHaveLength(3);
    });

    it('overwrites an existing completion (idempotent date update)', () => {
      const first = new Date('2026-01-15T10:00:00Z');
      const second = new Date('2026-01-16T10:00:00Z');
      useVaccineStore.getState().markCompleted('baby-1', 'bcg-1', first);
      useVaccineStore.getState().markCompleted('baby-1', 'bcg-1', second);
      const c = useVaccineStore.getState().completions['baby-1:bcg-1']!;
      expect(c.completedAt).toBe(second.toISOString());
    });

    it('stores the optional note', () => {
      useVaccineStore.getState().markCompleted('baby-1', 'bcg-1', new Date(), '소아과 A');
      expect(useVaccineStore.getState().completions['baby-1:bcg-1']!.note).toBe('소아과 A');
    });
  });

  describe('unmarkCompleted', () => {
    it('removes the completion for that baby + dose', () => {
      useVaccineStore.getState().markCompleted('baby-1', 'bcg-1', new Date());
      useVaccineStore.getState().unmarkCompleted('baby-1', 'bcg-1');
      expect(useVaccineStore.getState().completions['baby-1:bcg-1']).toBeUndefined();
    });

    it('leaves other completions untouched', () => {
      useVaccineStore.getState().markCompleted('baby-1', 'bcg-1', new Date());
      useVaccineStore.getState().markCompleted('baby-1', 'hepb-1', new Date());
      useVaccineStore.getState().unmarkCompleted('baby-1', 'bcg-1');
      expect(useVaccineStore.getState().completions['baby-1:hepb-1']).toBeDefined();
    });

    it('is a no-op when no completion exists', () => {
      const before = useVaccineStore.getState().completions;
      useVaccineStore.getState().unmarkCompleted('baby-1', 'never-set');
      expect(useVaccineStore.getState().completions).toEqual(before);
    });
  });

  describe('getCompletionsForBaby', () => {
    it('returns an empty object when nothing is completed for that baby', () => {
      expect(useVaccineStore.getState().getCompletionsForBaby('baby-1')).toEqual({});
    });

    it('returns a doseId → Date map for the given baby only', () => {
      const at1 = new Date('2026-01-15T10:00:00Z');
      const at2 = new Date('2026-02-01T10:00:00Z');
      useVaccineStore.getState().markCompleted('baby-1', 'bcg-1', at1);
      useVaccineStore.getState().markCompleted('baby-1', 'hepb-1', at2);
      useVaccineStore.getState().markCompleted('baby-2', 'bcg-1', new Date());

      const result = useVaccineStore.getState().getCompletionsForBaby('baby-1');
      expect(Object.keys(result)).toEqual(expect.arrayContaining(['bcg-1', 'hepb-1']));
      expect(result['bcg-1']!.toISOString()).toBe(at1.toISOString());
      expect(result['hepb-1']!.toISOString()).toBe(at2.toISOString());
      expect(result).not.toHaveProperty('that-other-baby');
    });
  });
});
