import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AppProvider } from '@/providers/AppProvider';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import colors from '@/constants/Colors';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

// Shared modal options
const modalOptions = {
  presentation: 'modal' as const,
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.text.primary,
  contentStyle: { backgroundColor: colors.primary },
  headerBackTitle: 'Wróć',
};

function RootLayoutNav() {
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen
          name='exercise-details'
          options={{
            ...modalOptions,
            title: 'Szczegóły ćwiczenia',
          }}
        />
        <Stack.Screen
          name='create-workout'
          options={{
            ...modalOptions,
            title: 'Nowy trening',
          }}
        />
        <Stack.Screen
          name='edit-workout'
          options={{
            ...modalOptions,
            title: 'Edytuj trening',
          }}
        />
        <Stack.Screen
          name='select-exercise'
          options={{
            ...modalOptions,
            title: 'Wybierz ćwiczenie',
          }}
        />
        <Stack.Screen
          name='active-workout'
          options={{
            ...modalOptions,
            presentation: 'fullScreenModal',
            title: 'Aktywny trening',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name='workout-details'
          options={{
            ...modalOptions,
            title: 'Szczegóły treningu',
          }}
        />
        <Stack.Screen
          name='exercise-progress'
          options={{
            ...modalOptions,
            title: 'Historia ćwiczenia',
          }}
        />
      </Stack>
    </AppProvider>
  );
}
