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
const modalOptions: NativeStackNavigationOptions = {
  presentation: 'transparentModal',
  animationTypeForReplace: 'push',
  headerShown: true,
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.text.primary,
  headerTitleStyle: { fontWeight: 'bold', color: colors.text.primary },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: colors.primary,
  },
};
function RootLayoutNav() {
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
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='exercise-details' options={{...modalOptions, title: 'Szczegóły ćwiczenia'}} />

        <Stack.Screen name='create-workout' options={{...modalOptions, title: 'Utwórz nowy trening'}} />

        <Stack.Screen name='edit-workout' options={{...modalOptions, title: 'Edytuj trening'}} />

        <Stack.Screen name='select-exercise' options={{...modalOptions, title: 'Lista ćwiczeń'}} />

        <Stack.Screen
          name='active-workout'
          options={{
            ...modalOptions,
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />

        <Stack.Screen name='workout-details' options={{...modalOptions, title: 'Szczegóły treningu'}} />

        <Stack.Screen name='exercise-progress' options={{...modalOptions, title: 'Historia ćwiczenia'}} />
      </Stack>
    </AppProvider>
  );
}
