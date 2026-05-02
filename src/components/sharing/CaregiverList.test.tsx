import { render, screen } from '@testing-library/react-native';

import type { Caregiver } from '@/features/sharing/api';

import { CaregiverList } from './CaregiverList';

const meId = 'user-self';
const partnerId = 'user-partner';

const me: Caregiver = {
  id: 'c1',
  baby_id: 'b1',
  user_id: meId,
  role: 'parent',
  permissions: ['read', 'write'],
  created_at: '2026-04-01T00:00:00Z',
};
const partner: Caregiver = {
  id: 'c2',
  baby_id: 'b1',
  user_id: partnerId,
  role: 'parent',
  permissions: ['read', 'write'],
  created_at: '2026-04-15T00:00:00Z',
};
const grandma: Caregiver = {
  id: 'c3',
  baby_id: 'b1',
  user_id: 'user-grandma',
  role: 'grandparent',
  permissions: ['read'],
  created_at: '2026-04-20T00:00:00Z',
};

describe('CaregiverList', () => {
  it('renders the count and per-caregiver row', () => {
    render(
      <CaregiverList
        caregivers={[me, partner]}
        currentUserId={meId}
        canManage={true}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByText('함께 돌보는 사람 2명')).toBeTruthy();
    // Self row marks "나"
    expect(screen.getByText('부모 · 나')).toBeTruthy();
  });

  it('shows empty-state copy when no caregivers exist', () => {
    render(
      <CaregiverList
        caregivers={[]}
        currentUserId={meId}
        canManage={true}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByText(/등록된 보호자가 없어요/)).toBeTruthy();
  });

  it('hides the remove button on the user own row', () => {
    render(
      <CaregiverList
        caregivers={[me]}
        currentUserId={meId}
        canManage={true}
        onRemove={() => {}}
      />,
    );
    expect(screen.queryByLabelText('보호자 제거')).toBeNull();
  });

  it('hides the remove button when user lacks management permission', () => {
    render(
      <CaregiverList
        caregivers={[me, partner]}
        currentUserId={meId}
        canManage={false}
        onRemove={() => {}}
      />,
    );
    expect(screen.queryByLabelText('보호자 제거')).toBeNull();
  });

  it('shows the remove button on others when user can manage', () => {
    render(
      <CaregiverList
        caregivers={[me, grandma]}
        currentUserId={meId}
        canManage={true}
        onRemove={() => {}}
      />,
    );
    expect(screen.getAllByLabelText('보호자 제거').length).toBe(1);
  });
});
