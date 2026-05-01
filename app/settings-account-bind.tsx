import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/GlassButton';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { getActiveAccount, type AccountContactKey, updateActiveAccountContact } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

const VALID_KEYS: AccountContactKey[] = ['qq', 'bilibili'];

function toContactKey(value: string | undefined): AccountContactKey {
  if (value && VALID_KEYS.includes(value as AccountContactKey)) return value as AccountContactKey;
  return 'qq';
}

export default function SettingsAccountBindScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ key?: string }>();
  const key = toContactKey(params.key);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.key === 'wechat') {
      router.back();
    }
  }, [params.key]);

  const labels: Record<AccountContactKey, string> = {
    qq: t('settingsBindQq'),
    wechat: t('settingsBindWechat'),
    bilibili: t('settingsBindBilibili'),
  };

  useLayoutEffect(() => {
    navigation.setOptions({ title: labels[key] });
  }, [key, labels, navigation]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const acc = await getActiveAccount();
        const next = (acc?.[key] as string | undefined) ?? '';
        if (!cancelled) setDraft(next);
      })();
      return () => {
        cancelled = true;
      };
    }, [key]),
  );

  const inputStyle = [
    styles.input,
    scheme === 'dark'
      ? { backgroundColor: 'rgba(28,28,30,0.55)', borderColor: 'rgba(255,255,255,0.12)', color: '#fff' }
      : { backgroundColor: 'rgba(255,255,255,0.45)', borderColor: 'rgba(60,60,67,0.12)', color: '#000' },
  ];

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await updateActiveAccountContact(key, draft);
      if (!res.ok) {
        Alert.alert(t('alertSaveFail'), res.error);
        return;
      }
      Alert.alert(t('alertTip'), t('settingsBindSaved'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.label}>{labels[key]}</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={t('settingsBindPlaceholder')}
        placeholderTextColor="#8e8e93"
        autoCapitalize="none"
        autoCorrect={false}
        style={inputStyle}
      />
      <GlassButton
        variant="prominent"
        label={saving ? t('profileSaving') : t('settingsBindSave')}
        onPress={() => void onSave()}
        disabled={saving}
        style={styles.btn}
      />
      <Text style={styles.hint}>{t('settingsContactMonthlyRuleHint')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    opacity: 0.72,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  btn: {
    marginTop: 16,
  },
  hint: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.72,
  },
});
