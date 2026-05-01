import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useAppPreferences } from '@/context/AppPreferences';
import { APP_LANGUAGE_OPTIONS, type AppLanguage } from '@/lib/prefsStorage';
import { useI18n } from '@/lib/useI18n';

/** 语言列表固定写法，不随界面语言切换（避免繁中在英文界面变成 Traditional Chinese） */
const LANGUAGE_OPTION_LABEL: Record<AppLanguage, string> = {
  zh: '简体中文',
  zht: '繁体中文',
  en: 'English',
  ja: '日本语',
  ko: '韩语',
};

export default function SettingsLanguageScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { prefs, setLanguage } = useAppPreferences();
  const { t } = useI18n();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settingsLang') });
  }, [navigation, t]);

  const chipLang = (active: boolean) => [styles.chipLang, active ? styles.chipOn : styles.chipOff];

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      <RNView style={styles.col}>
        {APP_LANGUAGE_OPTIONS.map((code) => (
          <Pressable
            key={code}
            style={chipLang(prefs.language === code)}
            onPress={() => void setLanguage(code)}>
            <Text style={styles.chipText}>{LANGUAGE_OPTION_LABEL[code]}</Text>
          </Pressable>
        ))}
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
  },
  col: {
    gap: 10,
  },
  chipLang: {
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
});
