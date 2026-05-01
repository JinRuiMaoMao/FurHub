import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/GlassButton';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { getActiveAccount, updateActiveAccountDisplayName } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

export default function SettingsAccountNameScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { t } = useI18n();

  const [draftName, setDraftName] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settingsChangeName') });
  }, [navigation, t]);

  const load = useCallback(async () => {
    const acc = await getActiveAccount();
    setDraftName(acc?.name ?? '');
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

  const onSaveName = async () => {
    setBusy(true);
    setSavedHint(null);
    try {
      const res = await updateActiveAccountDisplayName(draftName);
      if (!res.ok) {
        Alert.alert(t('alertSaveFail'), res.error);
        return;
      }
      setSavedHint(t('profileSavedLocal'));
      Keyboard.dismiss();
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.label}>{t('profileEditNameLabel')}</Text>
      <TextInput
        value={draftName}
        onChangeText={setDraftName}
        placeholder={t('profilePlaceholderDisplayName')}
        placeholderTextColor={inputColors.placeholder}
        maxLength={20}
        autoCapitalize="none"
        autoCorrect={false}
        style={inputStyle}
      />
      <GlassButton
        variant="prominent"
        label={busy ? t('profileSaving') : t('profileSaveName')}
        onPress={() => void onSaveName()}
        disabled={busy}
        style={styles.primaryBtn}
      />
      {savedHint ? <Text style={styles.saved}>{savedHint}</Text> : null}
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
    marginTop: 4,
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
  },
  saved: {
    marginTop: 10,
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.72,
  },
});
