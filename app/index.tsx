import { Text, View } from 'react-native';

import { APP_NAME } from '@/constants/config';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Hello</Text>
      <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>{APP_NAME}</Text>
    </View>
  );
}
