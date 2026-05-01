import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassSurface';
import { Text } from '@/components/Themed';
import { getActiveAccount } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountAvatar, setAccountAvatar] = useState<string | null>(null);
  const [accountVip, setAccountVip] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settingsTitle') });
  }, [navigation, t]);

  const loadAccount = useCallback(async () => {
    const acc = await getActiveAccount();
    setAccountName(acc?.name ?? null);
    setAccountEmail(acc?.email ?? null);
    setAccountAvatar(acc?.avatar ?? null);
    setAccountVip((acc?.isVip === true) || acc?.name.trim() === 'JinRui_MaoMao');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAccount();
    }, [loadAccount]),
  );

  const displayName = accountName?.trim() || t('profileNameUnset');
  const avatarRaw = accountAvatar?.trim() ?? '';
  const avatarLetter = (avatarRaw || displayName.slice(0, 1)).toUpperCase();
  const avatarIsImage = /^file:|^content:|^https?:/i.test(avatarRaw);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={() => router.push('/settings-account')}>
          <GlassCard borderRadius={18} intensity={52} vibe="neutral" contentStyle={styles.accountCard}>
            <Text style={styles.sectionTitle}>{t('settingsAccount')}</Text>
            <Text style={styles.accountArrow}>›</Text>
            {avatarIsImage ? (
              <Image source={{ uri: avatarRaw }} style={[styles.avatarImage, accountVip && styles.avatarVip]} />
            ) : (
              <Text style={[styles.avatar, accountVip && styles.avatarVip]}>{avatarLetter}</Text>
            )}
            {accountVip ? <Text style={styles.vipTag}>{t('vipUserTag')}</Text> : null}
            <Text style={styles.accountName}>{displayName}</Text>
            <Text style={styles.accountEmail}>{accountEmail ?? t('settingsAccountLoggedOut')}</Text>
          </GlassCard>
        </Pressable>

        <Pressable style={styles.entry} onPress={() => router.push('/settings-language')}>
          <Text style={styles.entryLabel}>{t('settingsLang')}</Text>
          <Text style={styles.entryArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.entry} onPress={() => router.push('/settings-appearance')}>
          <Text style={styles.entryLabel}>{t('settingsTheme')}</Text>
          <Text style={styles.entryArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.entry} onPress={() => router.push('/modal')}>
          <Text style={styles.entryLabel}>{t('settingsAbout')}</Text>
          <Text style={styles.entryArrow}>›</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  accountCard: {
    padding: 14,
    minHeight: 138,
    paddingLeft: 116,
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(120,120,128,0.08)',
  },
  avatar: {
    position: 'absolute',
    left: 14,
    top: 14,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(99,102,241,0.22)',
    color: '#6366f1',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 84,
    fontSize: 34,
    fontWeight: '700',
    overflow: 'hidden',
  },
  avatarImage: {
    position: 'absolute',
    left: 14,
    top: 14,
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarVip: {
    borderWidth: 3,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  vipTag: {
    position: 'absolute',
    left: 14,
    top: 102,
    width: 84,
    fontSize: 11,
    textAlign: 'center',
    color: '#d97706',
    fontWeight: '700',
  },
  accountName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 13,
    opacity: 0.72,
  },
  entry: {
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(120,120,128,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  accountArrow: {
    position: 'absolute',
    right: 14,
    top: 10,
    fontSize: 22,
    opacity: 0.5,
  },
  entryArrow: {
    fontSize: 22,
    opacity: 0.5,
  },
});
