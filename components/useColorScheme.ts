import { useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useAppPreferencesOptional } from '@/context/AppPreferences';

/**
 * 尊重「设置」中的外观：浅色 / 深色 / 跟随系统。
 */
export function useColorScheme(): 'light' | 'dark' | null {
  const system = useRNColorScheme();
  const prefs = useAppPreferencesOptional();

  return useMemo(() => {
    if (!prefs?.ready) {
      return system ?? 'light';
    }
    if (prefs.prefs.theme === 'light') return 'light';
    if (prefs.prefs.theme === 'dark') return 'dark';
    return system ?? 'light';
  }, [prefs?.ready, prefs?.prefs.theme, system]);
}
