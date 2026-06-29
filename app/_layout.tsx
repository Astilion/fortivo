import colors from '@/constants/Colors';
import { ActiveWorkoutFAB } from '@/components/ui/ActiveWorkoutFAB';
import { Toast } from '@/components/Toast';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { AppProvider } from '@/providers/AppProvider';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import { useFonts } from 'expo-font';
import {
  Href,
  Redirect,
  Stack,
  useNavigationContainerRef,
  usePathname,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
export { ErrorBoundary, usePathname } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

// Module scope so startup errors are captured before any component mounts.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // Local/dev runs must not pollute the project; errors are the priority,
  // tracing stays at a token sample.
  enabled: !__DEV__,
  tracesSampleRate: 0.1,
  integrations: [navigationIntegration],
  enableNativeFramesTracking: !isRunningInExpoGo(),
  sendDefaultPii: false,
  beforeBreadcrumb(breadcrumb) {
    // console args are the only breadcrumb channel that can carry user data
    return breadcrumb.category === 'console' ? null : breadcrumb;
  },
  beforeSend(event) {
    delete event.user;
    return event;
  },
});

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

function RootLayout() {
  const activeWorkoutId = useActiveWorkoutStore((state) => state.workoutId);
  const workoutStartTime = useActiveWorkoutStore(
    (state) => state.workoutStartTime,
  );
  const navigationRef = useNavigationContainerRef();
  const pathname = usePathname();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const showOnboarding = useOnboardingStore((state) => state.showOnboarding);

  const isReady = loaded && showOnboarding !== null;

  useEffect(() => {
    if (navigationRef?.current) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    useOnboardingStore.getState().loadStatus();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <KeyboardProvider>
      <AppProvider>
        <ThemeProvider value={FortivoDarkTheme}>
          <StatusBar style="light" backgroundColor={colors.primary} />
          {showOnboarding && <Redirect href={'/onboarding' as Href} />}
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
              name="(tabs)"
              options={{
                headerShown: false,
                title: '',
              }}
            />

            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false, animation: 'fade' }}
            />

            <Stack.Screen
              name="exercise-details"
              options={{ ...commonScreenOptions, title: 'Szczegóły Ćwiczenia' }}
            />

            <Stack.Screen
              name="create-workout"
              options={{ ...commonScreenOptions, title: 'Utwórz Nowy Trening' }}
            />

            <Stack.Screen
              name="edit-workout"
              options={{ ...commonScreenOptions, title: 'Edytuj Trening' }}
            />

            <Stack.Screen
              name="select-exercise"
              options={{ ...commonScreenOptions, title: 'Lista Ćwiczeń' }}
            />

            <Stack.Screen
              name="active-workout"
              options={{
                ...commonScreenOptions,
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                title: 'Aktywny trening',
              }}
            />

            <Stack.Screen
              name="workout-details"
              options={{ ...commonScreenOptions, title: 'Szczegóły Treningu' }}
            />

            <Stack.Screen
              name="exercise-progress"
              options={{ ...commonScreenOptions, title: 'Historia Ćwiczenia' }}
            />
            <Stack.Screen
              name="weight-tracking"
              options={{ ...commonScreenOptions, title: 'Śledzenie Wagi' }}
            />
            <Stack.Screen
              name="body-measurements"
              options={{ ...commonScreenOptions, title: 'Śledzenie Pomiarów' }}
            />
            <Stack.Screen
              name="create-exercise"
              options={{ ...commonScreenOptions, title: 'Nowe Ćwiczenie' }}
            />
            <Stack.Screen
              name="create-weekly-plan"
              options={{
                ...commonScreenOptions,
                title: 'Nowy Plan Tygodniowy',
              }}
            />
            <Stack.Screen
              name="select-workout"
              options={{ ...commonScreenOptions, title: 'Wybierz trening' }}
            />
            <Stack.Screen
              name="preset-workout-details"
              options={{ ...commonScreenOptions, title: 'Gotowy Trening' }}
            />
          </Stack>
          {activeWorkoutId &&
            workoutStartTime &&
            pathname !== '/active-workout' && (
              <ActiveWorkoutFAB workoutStartTime={workoutStartTime} />
            )}
          <Toast />
        </ThemeProvider>
      </AppProvider>
    </KeyboardProvider>
  );
}

export default Sentry.wrap(RootLayout);
