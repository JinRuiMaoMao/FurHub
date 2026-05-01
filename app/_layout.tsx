import 'react-native-gesture-handler';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppPreferencesProvider, useAppPreferences } from '@/context/AppPreferences';
import { ensureTestAccount } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

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
      void ensureTestAccount();
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
    <AppPreferencesProvider>
      <ThemedStack />
    </AppPreferencesProvider>
  );
}

function ThemedStack() {
  const { navigationScheme } = useAppPreferences();
  const { t } = useI18n();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={navigationScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            // Keep web transitions lightweight, while giving native apps smoother page motion.
            animation: Platform.select({
              ios: 'default',
              android: 'slide_from_right',
              default: 'none',
            }),
            animationDuration: 260,
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="search"
            options={{
              presentation: 'modal',
              animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
            }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              presentation: 'modal',
              title: t('settingsTitle'),
              animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
