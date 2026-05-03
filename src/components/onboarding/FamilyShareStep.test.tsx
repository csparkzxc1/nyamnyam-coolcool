import { fireEvent, render, screen } from '@testing-library/react-native';

import { FamilyShareStep } from './FamilyShareStep';

const noop = () => {};

describe('FamilyShareStep', () => {
  it('renders all three terminal actions', () => {
    render(
      <FamilyShareStep
        inviteUrl={null}
        isFinalizing={false}
        onShareKakao={noop}
        onCopyLink={noop}
        onSkip={noop}
        onBack={noop}
      />,
    );
    expect(screen.getByLabelText('카카오톡으로 공유')).toBeTruthy();
    expect(screen.getByLabelText('초대 링크 복사')).toBeTruthy();
    expect(screen.getByLabelText('나중에 할게요')).toBeTruthy();
  });

  it('shows the invite URL once it has been generated', () => {
    render(
      <FamilyShareStep
        inviteUrl="https://nyamnyam.app/invite/abc"
        isFinalizing={false}
        onShareKakao={noop}
        onCopyLink={noop}
        onSkip={noop}
        onBack={noop}
      />,
    );
    expect(screen.getByText('https://nyamnyam.app/invite/abc')).toBeTruthy();
  });

  it('shows the loading state while finalizing', () => {
    render(
      <FamilyShareStep
        inviteUrl={null}
        isFinalizing
        onShareKakao={noop}
        onCopyLink={noop}
        onSkip={noop}
        onBack={noop}
      />,
    );
    expect(screen.getByText('준비 중이에요…')).toBeTruthy();
  });

  it('routes the kakao / copy / skip taps to the right handlers', () => {
    const onShareKakao = jest.fn();
    const onCopyLink = jest.fn();
    const onSkip = jest.fn();
    render(
      <FamilyShareStep
        inviteUrl={null}
        isFinalizing={false}
        onShareKakao={onShareKakao}
        onCopyLink={onCopyLink}
        onSkip={onSkip}
        onBack={noop}
      />,
    );
    fireEvent.press(screen.getByLabelText('카카오톡으로 공유'));
    fireEvent.press(screen.getByLabelText('초대 링크 복사'));
    fireEvent.press(screen.getByLabelText('나중에 할게요'));
    expect(onShareKakao).toHaveBeenCalledTimes(1);
    expect(onCopyLink).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
