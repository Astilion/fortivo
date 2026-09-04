import colors from '@/constants/Colors';
import { ActiveWorkoutFAB } from '@/components/ui/ActiveWorkoutFAB';
import { Toast } from '@/components/Toast';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { AppProvider } from '@/providers/AppProvider';
import { isCrashReportingEnabled } from '@/utils/crashReporting';
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

const MAX_ERRORS_PER_SESSION = 25;
const MAX_TRANSACTIONS_PER_SESSION = 10;
let sentErrorCount = 0;
let sentTransactionCount = 0;

// Route paths can carry entity IDs (/workout-details?id=…)
const stripQuery = (value: unknown) =>
  typeof value === 'string' ? value.split('?')[0] : undefined;

// Native (Android SDK) breadcrumbs bypass beforeBreadcrumb entirely, and
// server-side scrubbing clears the numeric network fields but leaves the
// boolean vpn_active — so the final event gets one more pass here.
const stripVpnFlag = <T extends { breadcrumbs?: Sentry.Breadcrumb[] }>(
  event: T,
): T => {
  event.breadcrumbs = event.breadcrumbs?.map((b) =>
    b.category === 'network.event' && b.data
      ? { ...b, data: { ...b.data, vpn_active: undefined } }
      : b,
  );
  return event;
};

const bootstrapCrashReporting = async () => {
  // `enabled: false` is not a kill switch: initAndBind ignores options.enabled
  // and the RN client calls _initNativeSdk() regardless, so native handlers
  // install anyway. Skipping init entirely is the only real off switch —
  // same mechanism as the user opt-out below.
  if (__DEV__) return;
  if (!(await isCrashReportingEnabled())) return;

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    integrations: [navigationIntegration],
    enableNativeFramesTracking: !isRunningInExpoGo(),
    sendDefaultPii: false,

    beforeBreadcrumb(breadcrumb) {
      // console args are an open channel for anything ever logged
      if (breadcrumb.category === 'console') return null;

      // TouchEventBoundary puts component names and a11y labels in `message`
      if (breadcrumb.category === 'touch') {
        return { ...breadcrumb, message: undefined, data: undefined };
      }

      // keep the navigation trail, drop the params
      if (breadcrumb.category === 'navigation') {
        return {
          ...breadcrumb,
          data: {
            from: stripQuery(breadcrumb.data?.from),
            to: stripQuery(breadcrumb.data?.to),
          },
        };
      }

      // network crumbs carry signal strength, bandwidth and VPN state —
      // none of which help debug a crash
      if (breadcrumb.category === 'network.event') {
        return {
          ...breadcrumb,
          data: {
            action: breadcrumb.data?.action,
            network_type: breadcrumb.data?.network_type,
          },
        };
      }

      return breadcrumb;
    },

    beforeSend(event) {
      // A crash loop on one tester's device can burn the whole monthly quota
      // and blind us for the rest of the period; rate limiting is
      // Business-plan only.
      if (sentErrorCount >= MAX_ERRORS_PER_SESSION) return null;
      sentErrorCount++;
      delete event.user;
      return stripVpnFlag(event);
    },

    beforeSendTransaction(event) {
      // beforeSend is never called for transactions — without this hook the
      // tracing sample bypasses both the scrubbing and the budget. Separate
      // counter so traces cannot starve the error budget.
      if (sentTransactionCount >= MAX_TRANSACTIONS_PER_SESSION) return null;
      sentTransactionCount++;
      delete event.user;
      return stripVpnFlag(event);
    },
  });
};

bootstrapCrashReporting();

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
