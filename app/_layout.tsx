import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AppProvider } from '@/providers/AppProvider';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import colors from '@/constants/Colors';
import 'react-native-reanimated';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
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

function RootLayoutNav() {
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen
          name='exercise-details'
          options={{
            presentation: 'modal',
            title: 'Szczegóły ćwiczenia',
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: colors.text.primary,
            headerTitleStyle: {
              color: colors.text.primary,
            },
          }}
        />
        <Stack.Screen
          name='create-workout'
          options={{
            presentation: 'modal',
            title: 'Nowy trening',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.text.primary,
            contentStyle: { backgroundColor: colors.primary },
          }}
        />
      </Stack>
    </AppProvider>
  );
}
