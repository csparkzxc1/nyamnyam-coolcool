import { fireEvent, render, screen } from '@testing-library/react-native';

import { GrowthEntryForm } from './GrowthEntryForm';

describe('GrowthEntryForm', () => {
  it('renders both inputs and the submit button', () => {
    render(<GrowthEntryForm onSubmit={() => {}} />);
    expect(screen.getByLabelText('몸무게 (kg)')).toBeTruthy();
    expect(screen.getByLabelText('키 (cm)')).toBeTruthy();
    expect(screen.getByLabelText('측정 기록 추가')).toBeTruthy();
  });

  it('shows error when both inputs are empty on submit', () => {
    const onSubmit = jest.fn();
    render(<GrowthEntryForm onSubmit={onSubmit} />);
    fireEvent.press(screen.getByLabelText('측정 기록 추가'));
    expect(screen.getByText(/하나는 입력/)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects out-of-range weight', () => {
    const onSubmit = jest.fn();
    render(<GrowthEntryForm onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText('몸무게 (kg)'), '99');
    fireEvent.press(screen.getByLabelText('측정 기록 추가'));
    expect(screen.getByText(/0~30 kg/)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when only weight is provided', () => {
    const onSubmit = jest.fn();
    render(<GrowthEntryForm onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText('몸무게 (kg)'), '6.5');
    fireEvent.press(screen.getByLabelText('측정 기록 추가'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.weightKg).toBe(6.5);
    expect(arg.heightCm).toBeNull();
    expect(arg.measuredAt).toBeInstanceOf(Date);
  });

  it('submits when only height is provided', () => {
    const onSubmit = jest.fn();
    render(<GrowthEntryForm onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText('키 (cm)'), '62');
    fireEvent.press(screen.getByLabelText('측정 기록 추가'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].heightCm).toBe(62);
  });

  it('disables the submit button while submitting', () => {
    render(<GrowthEntryForm onSubmit={() => {}} isSubmitting />);
    expect(screen.getByText('저장 중…')).toBeTruthy();
  });
});
