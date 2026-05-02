import { Pressable, Switch, Text, View } from 'react-native';

export interface SettingsRowProps {
  label: string;
  description?: string;
  /** When provided, renders a switch on the right. */
  toggle?: { value: boolean; onValueChange: (next: boolean) => void };
  /** When provided, renders a chevron on the right + makes the row pressable. */
  onPress?: () => void;
  /** Additional content rendered below the label/description. */
  children?: React.ReactNode;
}

/**
 * Generic settings list row. Used by the Settings tab for both toggles
 * (notifications on/off, individual category opt-outs) and tap-to-open
 * sub-screens (DND time picker, tone picker).
 */
export function SettingsRow({
  label,
  description,
  toggle,
  onPress,
  children,
}: SettingsRowProps) {
  const Container: React.ElementType = onPress ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean } = {}) => ({
        backgroundColor: pressed ? 'rgba(42, 29, 18, 0.04)' : '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        gap: 8,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text className="font-body text-[14px] font-medium" style={{ color: '#2A1D12' }}>
            {label}
          </Text>
          {description ? (
            <Text
              className="mt-[2px] font-body text-[12px]"
              style={{ color: '#8A7A63', lineHeight: 12 * 1.5 }}
            >
              {description}
            </Text>
          ) : null}
        </View>
        {toggle ? (
          <Switch
            value={toggle.value}
            onValueChange={toggle.onValueChange}
            trackColor={{ true: '#B85428', false: '#D6BFA0' }}
          />
        ) : null}
      </View>
      {children}
    </Container>
  );
}
