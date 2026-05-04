import { Tabs } from 'expo-router';
import { Book, House, List, Settings, Users } from 'lucide-react-native';

const ACTIVE_TINT = '#B85428'; // sienna
const INACTIVE_TINT = '#8A7A63'; // muted

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'rgba(42, 29, 18, 0.06)',
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <House size={size ?? 22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: '기록',
          tabBarIcon: ({ color, size }) => (
            <List size={size ?? 22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: '가이드',
          tabBarIcon: ({ color, size }) => (
            <Book size={size ?? 22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: '공유',
          tabBarIcon: ({ color, size }) => (
            <Users size={size ?? 22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size ?? 22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
