import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useAppPreferences } from '@/context/AppPreferences';
import { useI18n } from '@/lib/useI18n';

export default function SettingsAppearanceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { prefs, setThemePreference } = useAppPreferences();
  const { t } = useI18n();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settingsTheme') });
  }, [navigation, t]);

  const chipTheme = (active: boolean) => [styles.chipTheme, active ? styles.chipOn : styles.chipOff];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + 24, flexGrow: 1 },
      ]}>
      <RNView style={styles.body}>
        <RNView style={styles.col}>
          <Pressable
            style={chipTheme(prefs.theme === 'system')}
            onPress={() => void setThemePreference('system')}>
            <Text style={styles.chipText}>{t('settingsThemeSystem')}</Text>
          </Pressable>
          <Pressable
            style={chipTheme(prefs.theme === 'light')}
            onPress={() => void setThemePreference('light')}>
            <Text style={styles.chipText}>{t('settingsThemeLight')}</Text>
          </Pressable>
          <Pressable
            style={chipTheme(prefs.theme === 'dark')}
            onPress={() => void setThemePreference('dark')}>
            <Text style={styles.chipText}>{t('settingsThemeDark')}</Text>
          </Pressable>
        </RNView>
        <Text style={styles.hint}>{t('settingsThemeStoreHint')}</Text>
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  col: {
    gap: 10,
  },
  chipTheme: {
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  chipOff: {
    backgroundColor: 'rgba(120,120,128,0.12)',
  },
  chipOn: {
    backgroundColor: 'rgba(99,102,241,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.45)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.55,
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingTop: 24,
  },
});
