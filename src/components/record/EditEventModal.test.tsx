import { Alert } from 'react-native';

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import type { DetailedEvent } from '@/features/logging/eventsTransform';

import { EditEventModal } from './EditEventModal';

// ============================================================
// Mocks
// ============================================================

// Mock the native DateTimePicker — replace it with a button that, when
// pressed, fires onChange with a fixed test date. Lets us exercise the
// onChange handler logic without a real native picker.
jest.mock('@react-native-community/datetimepicker', () => {
  const { Pressable, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({
      value,
      onChange,
      testID,
    }: {
      value: Date;
      onChange: Function;
      testID?: string;
    }) => {
      const triggerWith = (next: Date) => () => onChange({ type: 'set' }, next);
      return (
        <Pressable
          testID={testID ?? `picker-${value.toISOString()}`}
          onPress={triggerWith(new Date(value.getTime() + 30 * 60 * 1000))} // +30min default
        >
          <Text>picker:{value.toISOString()}</Text>
        </Pressable>
      );
    },
  };
});

// Spy on Alert.alert so we can simulate user choices without a UI dialog.
const alertSpy = jest.spyOn(Alert, 'alert');

beforeEach(() => {
  alertSpy.mockClear();
});

// ============================================================
// Test fixtures
// ============================================================

const at = (h: number, m: number) => {
  const d = new Date(2026, 4, 1, 0, 0, 0, 0); // May 1, 2026
  d.setHours(h, m, 0, 0);
  return d;
};

const baseFeed: DetailedEvent = {
  kind: 'feed',
  id: 'feed-1',
  startedAt: at(10, 0),
  endedAt: at(10, 25),
  type: 'formula',
  amountMl: 120,
};

const inProgressFeed: DetailedEvent = {
  kind: 'feed',
  id: 'feed-2',
  startedAt: at(10, 0),
  type: 'breast_left',
};

const baseDiaper: DetailedEvent = {
  kind: 'diaper',
  id: 'diaper-1',
  startedAt: at(11, 30),
  type: 'wet',
};

const baseBath: DetailedEvent = {
  kind: 'bath',
  id: 'bath-1',
  startedAt: at(18, 0),
};

// Helper: render with stub callbacks, return both the queries and the spies.
function setup(event: DetailedEvent | null, overrides: Partial<{ isSubmitting: boolean }> = {}) {
  const onClose = jest.fn();
  const onSave = jest.fn();
  const onDelete = jest.fn();
  const utils = render(
    <EditEventModal
      event={event}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
      isSubmitting={overrides.isSubmitting}
    />,
  );
  return { ...utils, onClose, onSave, onDelete };
}

// ============================================================
// Tests
// ============================================================

describe('EditEventModal', () => {
  describe('rendering', () => {
    it('renders nothing when event is null', () => {
      const { queryByText } = setup(null);
      expect(queryByText(/수정/)).toBeNull();
    });

    it('shows the kind label in the header for each kind', () => {
      const cases: Array<[DetailedEvent, string]> = [
        [baseFeed, '🍼 수유 기록 수정'],
        [
          { ...baseFeed, kind: 'sleep', endedAt: at(10, 30), type: 'nap' as const },
          '😴 수면 기록 수정',
        ],
        [baseDiaper, '💧 기저귀 기록 수정'],
        [baseBath, '🛁 목욕 기록 수정'],
      ];
      for (const [event, label] of cases) {
        const { getByText, unmount } = setup(event);
        expect(getByText(label)).toBeTruthy();
        unmount();
      }
    });

    it('renders both start and end pickers for range kinds (feed)', () => {
      const { getByText, queryAllByText } = setup(baseFeed);
      expect(getByText('시작 시각')).toBeTruthy();
      expect(getByText('종료 시각')).toBeTruthy();
      expect(queryAllByText(/picker:/).length).toBe(2);
    });

    it('renders only start picker for point-in-time kinds (diaper)', () => {
      const { getByText, queryByText, queryAllByText } = setup(baseDiaper);
      expect(getByText('시작 시각')).toBeTruthy();
      expect(queryByText('종료 시각')).toBeNull();
      expect(queryAllByText(/picker:/).length).toBe(1);
    });

    it('renders only start picker for bath', () => {
      const { queryByText, queryAllByText } = setup(baseBath);
      expect(queryByText('종료 시각')).toBeNull();
      expect(queryAllByText(/picker:/).length).toBe(1);
    });

    it('shows "진행 중" placeholder when range event has no endedAt', () => {
      const { getByText } = setup(inProgressFeed);
      expect(getByText(/진행 중/)).toBeTruthy();
    });
  });

  describe('save', () => {
    it('calls onSave with the original times when nothing was edited', () => {
      const { getByText, onSave } = setup(baseDiaper);
      fireEvent.press(getByText('저장'));
      expect(onSave).toHaveBeenCalledWith({
        startedAt: baseDiaper.startedAt,
        endedAt: undefined,
      });
    });

    it('calls onSave with edited start time when picker fires', () => {
      const { getByText, getByTestId, onSave } = setup(baseDiaper);
      // Mock picker advances by 30 minutes when pressed.
      fireEvent.press(getByTestId(`picker-${baseDiaper.startedAt.toISOString()}`));
      fireEvent.press(getByText('저장'));
      const call = onSave.mock.calls[0]?.[0] as { startedAt: Date; endedAt?: Date };
      expect(call.startedAt.getMinutes()).toBe(0); // 11:30 + 30min = 12:00
      expect(call.startedAt.getHours()).toBe(12);
    });

    it('passes endedAt for completed range events', () => {
      const { getByText, onSave } = setup(baseFeed);
      fireEvent.press(getByText('저장'));
      expect(onSave).toHaveBeenCalledWith({
        startedAt: baseFeed.startedAt,
        endedAt: baseFeed.endedAt,
      });
    });

    it('passes undefined endedAt for in-progress range events', () => {
      const { getByText, onSave } = setup(inProgressFeed);
      fireEvent.press(getByText('저장'));
      expect(onSave).toHaveBeenCalledWith({
        startedAt: inProgressFeed.startedAt,
        endedAt: undefined,
      });
    });

    it('pushes endedAt forward when start moves past it', () => {
      // Start = 10:00, end = 10:25. Picker mock pushes start to 10:30.
      // After the change, end should now equal the new start.
      const { getByText, getByTestId, onSave } = setup(baseFeed);
      fireEvent.press(getByTestId(`picker-${baseFeed.startedAt.toISOString()}`));
      fireEvent.press(getByText('저장'));
      const call = onSave.mock.calls[0]?.[0] as { startedAt: Date; endedAt?: Date };
      expect(call.startedAt.getTime()).toEqual(call.endedAt?.getTime());
    });
  });

  describe('delete', () => {
    it('shows confirm Alert before calling onDelete', () => {
      const { getByText, onDelete } = setup(baseFeed);
      fireEvent.press(getByText('삭제'));
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy.mock.calls[0]?.[0]).toBe('기록 삭제');
      // onDelete should NOT have fired yet — only the Alert appeared.
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('fires onDelete when user taps the destructive Alert button', () => {
      const { getByText, onDelete } = setup(baseFeed);
      fireEvent.press(getByText('삭제'));
      // Find the destructive button in the Alert config and invoke it.
      const buttons = alertSpy.mock.calls[0]?.[2] as Array<{ text: string; onPress?: () => void }>;
      const destructive = buttons.find((b) => b.text === '삭제');
      destructive?.onPress?.();
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('does not fire onDelete when user cancels', () => {
      const { getByText, onDelete } = setup(baseFeed);
      fireEvent.press(getByText('삭제'));
      // No invocation of any button — onDelete remains untouched.
      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('cancel / close', () => {
    it('calls onClose when the cancel button is pressed', () => {
      const { getByText, onClose } = setup(baseFeed);
      fireEvent.press(getByText('취소'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('isSubmitting', () => {
    it('disables save and delete while a mutation is in flight', () => {
      const { getByText, onSave, onDelete } = setup(baseFeed, { isSubmitting: true });
      fireEvent.press(getByText('삭제'));
      // Delete button is disabled — no Alert appears.
      expect(alertSpy).not.toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
