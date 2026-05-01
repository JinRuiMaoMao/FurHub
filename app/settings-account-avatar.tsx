import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/GlassButton';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { getActiveAccount, updateActiveAccountAvatar } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

export default function SettingsAccountAvatarScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const [draftAvatar, setDraftAvatar] = useState('');
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settingsChangeAvatar') });
  }, [navigation, t]);

  const load = useCallback(async () => {
    const acc = await getActiveAccount();
    setDraftAvatar(acc?.avatar ?? '');
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
      const res = await updateActiveAccountAvatar(draftAvatar);
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

  const onPickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('alertTip'), t('settingsAvatarPermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      aspect: [1, 1],
    });
    if (result.canceled || result.assets.length === 0) return;
    setDraftAvatar(result.assets[0].uri);
  };

  const isAvatarImage = /^file:|^content:|^https?:/i.test(draftAvatar.trim());

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.label}>{t('settingsChangeAvatar')}</Text>
      <View style={styles.previewWrap}>
        {isAvatarImage ? (
          <Image source={{ uri: draftAvatar }} style={styles.previewImage} />
        ) : (
          <Text style={styles.previewText}>{(draftAvatar.trim() || '🙂').slice(0, 2).toUpperCase()}</Text>
        )}
      </View>
      <GlassButton
        variant="neutral"
        label={t('settingsPickAvatar')}
        onPress={() => void onPickImage()}
        disabled={busy}
        style={styles.secondaryBtn}
      />
      <TextInput
        value={draftAvatar}
        onChangeText={setDraftAvatar}
        placeholder={t('settingsAvatarPlaceholder')}
        placeholderTextColor={inputColors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={2}
        style={inputStyle}
      />
      <GlassButton
        variant="prominent"
        label={busy ? t('profileSaving') : t('settingsSaveAvatar')}
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
  previewWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    marginBottom: 10,
  },
  previewImage: {
    width: 96,
    height: 96,
  },
  previewText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#6366f1',
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
  secondaryBtn: {
    alignSelf: 'stretch',
    marginBottom: 10,
  },
});
