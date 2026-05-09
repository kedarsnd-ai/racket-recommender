import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.courtDark },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.bgDeep }
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Racket IQ',
            headerLargeTitle: false
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
