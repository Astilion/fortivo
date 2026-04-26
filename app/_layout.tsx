import colors from '@/constants/Colors';
import { ActiveWorkoutFAB } from '@/components/ui/ActiveWorkoutFAB';
import { useWorkoutStore } from '@/store/workoutStore';
import { AppProvider } from '@/providers/AppProvider';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
export { ErrorBoundary, usePathname } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const FortivoDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.primary,
    card: colors.primary,
    border: colors.secondary,
    text: colors.text.primary,
    primary: colors.accent,
  },
};
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
  animation: 'fade',
};

export default function RootLayout() {
  const activeWorkoutId = useWorkoutStore((state) => state.activeWorkoutId);
  const workoutStartTime = useWorkoutStore((state) => state.workoutStartTime);
  const pathname = usePathname();
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
      <ThemeProvider value={FortivoDarkTheme}>
        <StatusBar style='light' backgroundColor={colors.primary} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.primary,
            },
            animation: 'fade',
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
            options={{ ...commonScreenOptions, title: 'Szczegóły Ćwiczenia' }}
          />

          <Stack.Screen
            name='create-workout'
            options={{ ...commonScreenOptions, title: 'Utwórz Nowy Trening' }}
          />

          <Stack.Screen
            name='edit-workout'
            options={{ ...commonScreenOptions, title: 'Edytuj Trening' }}
          />

          <Stack.Screen
            name='select-exercise'
            options={{ ...commonScreenOptions, title: 'Lista Ćwiczeń' }}
          />

          <Stack.Screen
            name='active-workout'
            options={{
              ...commonScreenOptions,
              presentation: 'fullScreenModal',
              gestureEnabled: false,
              title: 'Aktywny trening',
            }}
          />

          <Stack.Screen
            name='workout-details'
            options={{ ...commonScreenOptions, title: 'Szczegóły Treningu' }}
          />

          <Stack.Screen
            name='exercise-progress'
            options={{ ...commonScreenOptions, title: 'Historia Ćwiczenia' }}
          />
          <Stack.Screen
            name='weight-tracking'
            options={{ ...commonScreenOptions, title: 'Śledzenie Wagi' }}
          />
          <Stack.Screen
            name='body-measurements'
            options={{ ...commonScreenOptions, title: 'Śledzenie Pomiarów' }}
          />
          <Stack.Screen
            name='create-exercise'
            options={{ ...commonScreenOptions, title: 'Nowe Ćwiczenie' }}
          />
          <Stack.Screen
            name='create-weekly-plan'
            options={{ ...commonScreenOptions, title: 'Nowy Plan Tygodniowy' }}
          />
          <Stack.Screen
            name='select-workout'
            options={{ ...commonScreenOptions, title: 'Wybierz trening' }}
          />
        </Stack>
        {activeWorkoutId &&
          workoutStartTime &&
          pathname !== '/active-workout' && (
            <ActiveWorkoutFAB workoutStartTime={workoutStartTime} />
          )}
      </ThemeProvider>
    </AppProvider>
  );
}
