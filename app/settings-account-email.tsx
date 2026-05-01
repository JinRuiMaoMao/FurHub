import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/GlassButton';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { getActiveAccount, updateActiveAccountEmail } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

export default function SettingsAccountEmailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const [email, setEmail] = useState<string | null>(null);
  const [draftEmail, setDraftEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settingsChangeEmail') });
  }, [navigation, t]);

  const load = useCallback(async () => {
    const acc = await getActiveAccount();
    setEmail(acc?.email ?? null);
    setDraftEmail(acc?.email ?? '');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inputColors =
    colorScheme === 'dark'
      ? {
          bg: 'rgba(28,28,30,0.55)',
          border: 'rgba(255,255,255,0.12)',
          color: '#fff',
          placeholder: '#8e8e93',
        }
      : {
          bg: 'rgba(255,255,255,0.45)',
          border: 'rgba(60,60,67,0.12)',
          color: '#000',
          placeholder: '#8e8e93',
        };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: inputColors.bg,
      borderColor: inputColors.border,
      color: inputColors.color,
    },
  ];

  const onSave = async () => {
    setBusy(true);
    try {
      const res = await updateActiveAccountEmail(draftEmail);
      if (!res.ok) {
        Alert.alert(t('alertSaveFail'), res.error);
        return;
      }
      await load();
      Alert.alert(t('settingsTitle'), t('profileSavedLocal'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.label}>{t('settingsEmailCurrent')}</Text>
      <Text style={styles.value}>{email ?? t('settingsAccountLoggedOut')}</Text>
      <Text style={styles.label}>{t('settingsChangeEmail')}</Text>
      <TextInput
        value={draftEmail}
        onChangeText={setDraftEmail}
        placeholder="you@example.com"
        placeholderTextColor={inputColors.placeholder}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={inputStyle}
      />
      <GlassButton
        variant="prominent"
        label={busy ? t('profileSaving') : t('settingsSaveEmail')}
        onPress={() => void onSave()}
        disabled={busy}
        style={styles.primaryBtn}
      />
      <Text style={styles.hint}>{t('settingsMonthlyRuleHint')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.72,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    marginTop: 18,
    marginBottom: 14,
  },
});
