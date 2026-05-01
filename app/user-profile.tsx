import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { getAccountByEmail, type LocalAccountRecord } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').trim().toLowerCase();
  const [account, setAccount] = useState<LocalAccountRecord | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('userProfileTitle') });
  }, [navigation, t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await getAccountByEmail(email);
      if (!cancelled) setAccount(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  if (!account) {
    return (
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.empty}>{t('userProfileNotFound')}</Text>
      </ScrollView>
    );
  }

  const avatarRaw = (account.avatar ?? '').trim();
  const avatarIsImage = /^file:|^content:|^https?:/i.test(avatarRaw);
  const avatarText = (avatarRaw || account.name.slice(0, 1)).toUpperCase();
  const isVip = account.isVip === true || account.name.trim() === 'JinRui_MaoMao';
  const isDemoMayKnowStub = account.email.trim().toLowerCase().endsWith('@furhub.demo');
  const openAppOrWeb = async (appUrl: string, webUrl: string) => {
    try {
      await Linking.openURL(appUrl);
      return;
    } catch {
      await Linking.openURL(webUrl);
    }
  };
  const openBilibili = async (url: string) => {
    const uidMatch = url.match(/space\.bilibili\.com\/(\d+)/i);
    const appUrl = uidMatch ? `bilibili://space/${uidMatch[1]}` : 'bilibili://';
    await openAppOrWeb(appUrl, url);
  };
  const openQqProfile = async (qq: string) => {
    const uin = qq.trim();
    if (!uin) return;
    const appUrl = `mqqapi://card/show_pslcard?src_type=internal&version=1&uin=${encodeURIComponent(uin)}&card_type=person`;
    const webUrl = `https://wpa.qq.com/msgrd?v=3&uin=${encodeURIComponent(uin)}&site=qq&menu=yes`;
    await openAppOrWeb(appUrl, webUrl);
  };
  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      {avatarIsImage ? (
        <Image source={{ uri: avatarRaw }} style={[styles.avatarImage, isVip && styles.avatarVip]} />
      ) : (
        <Text style={[styles.avatarText, isVip && styles.avatarVip]}>{avatarText}</Text>
      )}
      {isVip ? <Text style={styles.vipTag}>{t('vipUserTag')}</Text> : null}
      <Text style={styles.name}>{account.name}</Text>
      <Text style={styles.email}>{account.email}</Text>

      {account.interestTags && account.interestTags.length > 0 ? (
        <>
          <Text style={styles.section}>{t('userProfileInterestTagsSection')}</Text>
          <View style={styles.tagWrap}>
            {account.interestTags.map((tag, i) => (
              <View key={`${tag}-${i}`} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {account.personalSignature?.trim() ? (
        <>
          <Text style={styles.section}>{t('userProfilePersonalSignatureSection')}</Text>
          {isDemoMayKnowStub ? <Text style={styles.demoNote}>{t('userProfileDemoSignatureNote')}</Text> : null}
          <Text style={styles.signatureText}>{account.personalSignature.trim()}</Text>
        </>
      ) : null}

      <Text style={styles.section}>{t('userProfileContactSection')}</Text>
      {account.qq ? (
        <Pressable onPress={() => void openQqProfile(account.qq ?? '')} style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>QQ: {account.qq}</Text>
        </Pressable>
      ) : null}
      {account.bilibili ? (
        <Pressable onPress={() => void openBilibili(account.bilibili ?? '')} style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>{t('contactBilibiliLabel')}</Text>
        </Pressable>
      ) : null}
      {!account.qq && !account.bilibili ? (
        <Text style={styles.empty}>{t('userProfileNoContact')}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    alignItems: 'center',
  },
  avatarText: {
    width: 88,
    height: 88,
    borderRadius: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 88,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    marginTop: 8,
    fontSize: 12,
    color: '#d97706',
    fontWeight: '700',
  },
  name: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '700',
  },
  email: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.72,
  },
  section: {
    marginTop: 18,
    marginBottom: 8,
    alignSelf: 'stretch',
    fontSize: 16,
    fontWeight: '700',
  },
  demoNote: {
    alignSelf: 'stretch',
    fontSize: 12,
    opacity: 0.68,
    lineHeight: 17,
    marginBottom: 10,
  },
  tagWrap: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  signatureText: {
    alignSelf: 'stretch',
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.88,
  },
  linkBtn: {
    alignSelf: 'stretch',
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(120,120,128,0.14)',
    alignItems: 'center',
  },
  linkBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkBtnSecondary: {
    alignSelf: 'stretch',
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(120,120,128,0.08)',
    alignItems: 'center',
  },
  linkBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  empty: {
    alignSelf: 'stretch',
    fontSize: 13,
    opacity: 0.72,
    lineHeight: 20,
  },
});
