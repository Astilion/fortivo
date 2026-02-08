import colors from '@/constants/Colors';
import { AppProvider } from '@/providers/AppProvider';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const commonScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.accent,
  headerTitleStyle: { fontWeight: 'bold', color: colors.text.primary },
  headerShadowVisible: false,
  headerBackTitle: 'Wstecz',
  contentStyle: {
    backgroundColor: colors.primary,
  },
};

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

  return (
    <AppProvider>
      <StatusBar style='light' backgroundColor={colors.primary} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.primary,
          },
        }}
      >
        <Stack.Screen
          name='(tabs)'
          options={{
            headerShown: false,
            title: '',
          }}
        />

        <Stack.Screen
          name='exercise-details'
          options={{ ...commonScreenOptions, title: 'Szczegóły ćwiczenia' }}
        />

        <Stack.Screen
          name='create-workout'
          options={{ ...commonScreenOptions, title: 'Utwórz nowy trening' }}
        />

        <Stack.Screen
          name='edit-workout'
          options={{ ...commonScreenOptions, title: 'Edytuj trening' }}
        />

        <Stack.Screen
          name='select-exercise'
          options={{ ...commonScreenOptions, title: 'Lista ćwiczeń' }}
        />

        <Stack.Screen
          name='active-workout'
          options={{
            ...commonScreenOptions,
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            title: 'Aktywny trening'
          }}
        />

        <Stack.Screen
          name='workout-details'
          options={{ ...commonScreenOptions, title: 'Szczegóły treningu' }}
        />

        <Stack.Screen
          name='exercise-progress'
          options={{ ...commonScreenOptions, title: 'Historia ćwiczenia' }}
        />
      </Stack>
    </AppProvider>
  );
}
