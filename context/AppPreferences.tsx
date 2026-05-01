import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import {
  loadAppPrefs,
  saveEmailRelay,
  saveLanguage,
  saveThemePreference,
  type AppLanguage,
  type AppPrefs,
  type ThemePreference,
} from '@/lib/prefsStorage';

export type AppPreferencesContextValue = {
  ready: boolean;
  prefs: AppPrefs;
  /** 用于 Navigation ThemeProvider */
  navigationScheme: 'light' | 'dark';
  setThemePreference: (value: ThemePreference) => Promise<void>;
  setLanguage: (value: AppLanguage) => Promise<void>;
  setEmailRelay: (url: string, secret: string) => Promise<void>;
  refreshPrefs: () => Promise<void>;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

function resolveNavigationScheme(
  pref: ThemePreference,
  system: 'light' | 'dark' | null | undefined,
): 'light' | 'dark' {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<AppPrefs>({
    theme: 'system',
    language: 'zh',
    emailRelayUrl: '',
    emailRelaySecret: '',
  });

  const refreshPrefs = useCallback(async () => {
    const next = await loadAppPrefs();
    setPrefs(next);
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshPrefs();
      setReady(true);
    })();
  }, [refreshPrefs]);

  const navigationScheme = useMemo(
    () => resolveNavigationScheme(prefs.theme, systemScheme),
    [prefs.theme, systemScheme],
  );

  const setThemePreference = useCallback(async (value: ThemePreference) => {
    await saveThemePreference(value);
    await refreshPrefs();
  }, [refreshPrefs]);

  const setLanguage = useCallback(
    async (value: AppLanguage) => {
      setPrefs((prev) => ({ ...prev, language: value }));
      try {
        await saveLanguage(value);
      } finally {
        await refreshPrefs();
      }
    },
    [refreshPrefs],
  );

  const setEmailRelay = useCallback(async (url: string, secret: string) => {
    await saveEmailRelay(url, secret);
    await refreshPrefs();
  }, [refreshPrefs]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      ready,
      prefs,
      navigationScheme,
      setThemePreference,
      setLanguage,
      setEmailRelay,
      refreshPrefs,
    }),
    [
      ready,
      prefs,
      navigationScheme,
      setThemePreference,
      setLanguage,
      setEmailRelay,
      refreshPrefs,
    ],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  }
  return ctx;
}

export function useAppPreferencesOptional(): AppPreferencesContextValue | null {
  return useContext(AppPreferencesContext);
}
