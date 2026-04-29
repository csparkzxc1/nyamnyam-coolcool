import { beforeEach, describe, expect, it } from '@jest/globals';

import { useLoggingStore } from './loggingStore';

describe('useLoggingStore', () => {
  beforeEach(() => {
    useLoggingStore.setState({ activeTimer: null });
  });

  // ============================================================
  // startTimer
  // ============================================================

  describe('startTimer', () => {
    it('initialises a timer with null recordId', () => {
      useLoggingStore.getState().startTimer('feed');
      const timer = useLoggingStore.getState().activeTimer;
      expect(timer).not.toBeNull();
      expect(timer?.kind).toBe('feed');
      expect(timer?.recordId).toBeNull();
      expect(timer?.startedAt).toBeInstanceOf(Date);
    });

    it('overwrites an existing timer when starting a new kind', () => {
      const store = useLoggingStore.getState();
      store.startTimer('feed');
      store.attachRecordId('feed', 'feed-1');
      store.startTimer('sleep');

      const timer = useLoggingStore.getState().activeTimer;
      expect(timer?.kind).toBe('sleep');
      expect(timer?.recordId).toBeNull();
    });
  });

  // ============================================================
  // attachRecordId
  // ============================================================

  describe('attachRecordId', () => {
    it('attaches recordId when timer kind matches', () => {
      const store = useLoggingStore.getState();
      store.startTimer('feed');
      store.attachRecordId('feed', 'feed-uuid-1');

      expect(useLoggingStore.getState().activeTimer?.recordId).toBe('feed-uuid-1');
    });

    it('is a no-op when timer kind does not match (stale response)', () => {
      const store = useLoggingStore.getState();
      store.startTimer('sleep');
      // Late response from a previous feed mutation — should NOT overwrite.
      store.attachRecordId('feed', 'feed-uuid-1');

      const timer = useLoggingStore.getState().activeTimer;
      expect(timer?.kind).toBe('sleep');
      expect(timer?.recordId).toBeNull();
    });

    it('is a no-op when no timer is active', () => {
      useLoggingStore.getState().attachRecordId('feed', 'feed-uuid-1');
      expect(useLoggingStore.getState().activeTimer).toBeNull();
    });

    it('preserves startedAt and kind when attaching', () => {
      const store = useLoggingStore.getState();
      store.startTimer('feed');
      const before = useLoggingStore.getState().activeTimer;
      store.attachRecordId('feed', 'feed-uuid-1');
      const after = useLoggingStore.getState().activeTimer;

      expect(after?.kind).toBe(before?.kind);
      expect(after?.startedAt).toBe(before?.startedAt);
      expect(after?.recordId).toBe('feed-uuid-1');
    });
  });

  // ============================================================
  // stopTimer
  // ============================================================

  describe('stopTimer', () => {
    it('clears the active timer', () => {
      const store = useLoggingStore.getState();
      store.startTimer('feed');
      store.stopTimer();
      expect(useLoggingStore.getState().activeTimer).toBeNull();
    });

    it('is a no-op when no timer is active', () => {
      useLoggingStore.getState().stopTimer();
      expect(useLoggingStore.getState().activeTimer).toBeNull();
    });
  });
});
